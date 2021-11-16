// Firebase interactors
const functions = require( 'firebase-functions' )
const { db, dataFromSnap, increment } = require( './firebase' )
const dev = !!process.env.development
// Secrets
const { api } = functions.config()

// Libraries
const fetch = require( 'isomorphic-fetch' )
const Throttle = require( 'promise-parallel-throttle' )

// ///////////////////////////////
// Code helpers
// ///////////////////////////////

// Remote api checker, this ALWAYS resolves
// this is because I am not suer that this API will not suddenly be throttled or authenticated.
const checkCodeStatus = async code => {

	if( code.includes( 'testing' ) ) return { claimed: false }

	const apiUrl = dev ? 'https://dev-api.poap.tech' : 'https://api.poap.tech'
	if( dev ) console.log( `Calling ${ apiUrl } with ${ dev ? 'dev' : 'prod' } token` )

	return fetch( `${ apiUrl }/actions/claim-qr?qr_hash=${ code }`, {
		headers: {
			Authorization: `Bearer ${ dev ? api.devaccesstoken : api.accesstoken }`
		}
	} )
	.then( res => res.json() )
	.then( json => {
		if( dev ) console.log( 'Response: ', json )
		return json
	} )
	.catch( e => {

		// Log for my reference
		console.log( 'API error, if this keeps happening check in with the backend team: ', e )

		// Return object so the updateCodeStatus function can continue
		return {
			claimed: 'unknown'
		}
	} )
}

// Code updater
async function updateCodeStatus( code, cachedResponse ) {

	if( !code ) return

	// Check claim status on claim backend
	const { claimed, error, message } = cachedResponse || await checkCodeStatus( code )

	// Formulate updates
	const updates = { updated: Date.now() }
	if( error ) updates.error = `${ error }: ${ message }`
	else updates.claimed = claimed ? true : false

	// Track error frequency
	if( error ) {

		// Track by code
		await db.collection( 'erroredCodes' ).doc( code ).set( {
			updated: Date.now(),
			error: error,
			strikes: increment( 1 )
		} )

		// Track by error
		await db.collection( 'errors' ).doc( error ).set( {
			updated: Date.now(),
			strikes: increment( 1 ),
			message: message || ''
		} ).catch( e => {
			// This might happen if the remote error code has weird characters
			console.error( 'Unable to write error ', e )
		} )

	}

	// Set updated status to firestore
	return db.collection( 'codes' ).doc( code ).set( updates, { merge: true } )

}

// ///////////////////////////////
// Manual code check
// ///////////////////////////////
exports.checkIfCodeHasBeenClaimed = async ( code, context ) => {

	try {

		if( context.app == undefined ) {
			console.log( context )
			throw new Error( `App context error` )
		}

		// Check claim status on claim backend
		const status = await checkCodeStatus( code )
		const { claimed, error, message } = status

		// If claimed, or there was an error, mark it so
		if( claimed === true || error ) await updateCodeStatus( code, status )

		// Always trigger a return from a callable
		return true


	} catch( e ) {
		console.error( 'checkIfCodeHasBeenClaimed error: ', e )
	}

}


// ///////////////////////////////
// Check status of old unknowns
// ///////////////////////////////
exports.refreshOldUnknownCodes = async ( source, context ) => {

	// If this was called with context (cron) use delay check
	// if there was no context (frontend asked) then run with no delay
	const ageInMins = source == 'cron' ? 5 : 0
	const ageInMs = 1000 * 60 * ageInMins
	const errorSlowdownFactor = 10
	const maxInProgress = 10


	try {

		// Appcheck validation
		if( context.app == undefined ) {
			console.log( context )
			throw new Error( `App context error` )
		}

		// Get old unknown codes
		const oldUnknowns = await db.collection( 'codes' ).where( 'claimed', '==', 'unknown' ).where( 'updated', '<', Date.now() - ageInMs ).get().then( dataFromSnap )
		const [ clean, withErrors ] = oldUnknowns.reduce( ( acc, val ) => {

			const [ cleanAcc, errorAcc ] = acc
			if( val.error ) return [ cleanAcc, [ ...errorAcc, val ] ]
			else return [ [ ...cleanAcc, val ], errorAcc ]

		}, [ [], [] ] )

		// Make the error checking slower
		const olderWithErrors = withErrors.filter( ( { updated } ) => updated < ( Date.now() - ( ageInMs * errorSlowdownFactor ) ) )

		// Build action queue
		const queue = [ ...clean, ...olderWithErrors ].map( ( { uid } ) => function() {

			return updateCodeStatus( uid )

		} )

		// For every unknown, check the status against live API
		await Throttle.all( queue, {
			maxInProgress: maxInProgress
		} )

		return 'success'


	} catch( e ) {
		console.error( 'refreshOldUnknownCodes cron error ', e )
		return e
	}

}

// ///////////////////////////////
// Check status of scanned codes
// ///////////////////////////////
exports.refreshScannedCodesStatuses = async ( eventId, context ) => {

	// const oneHour = 1000 * 60 * 60
	const fiveMinutes = 1000 * 60 * 5
	const updateWindow = fiveMinutes
	const maxInProgress = 10


	try {

		// Appcheck validation
		if( context.app == undefined ) {
			console.log( context )
			throw new Error( `App context error` )
		}


		// Codes scanned in the last updateWindow that have not been claimed
		const scannedCodes = await db.collection( 'codes' )
									.where( 'event', '==', eventId )
									.where( 'scanned', '>', Date.now() - updateWindow )
									.get().then( dataFromSnap )

		const scannedAndUnclaimedCodes = scannedCodes.filter( ( { claimed } ) => !claimed )

		// Build action queue
		const queue = scannedAndUnclaimedCodes.map( ( { uid } ) => function() {

			return updateCodeStatus( uid )

		} )

		// For every unknown, check the status against live API
		await Throttle.all( queue, {
			maxInProgress: maxInProgress
		} )

		return { updated: scannedAndUnclaimedCodes.length }


	} catch( e ) {
		console.error( 'refreshOldUnknownCodes cron error ', e )
		return { error: e.message }
	}

}

/* ///////////////////////////////
// Public event data updater
// /////////////////////////////*/

exports.updatePublicEventAvailableCodes = async function( change, context ) {

	const { before, after } = change

	// Exit on deletion
	if( !after.exists ) return

	const { codeId } = context.params
	const { claimed: prevClaimed } = before.data()
	const { event, claimed } = after.data()

	// Do nothing if no change
	if( prevClaimed == claimed ) return

	// If it is now claimed, decrement available codes
	if( claimed == true ) return db.collection( 'publicEventData' ).doc( event ).set( { codesAvailable: increment( -1 ), updated: Date.now() }, { merge: true } )

}

// ///////////////////////////////
// Delete expired codes
// ///////////////////////////////
exports.deleteExpiredCodes = async () => {


	try {

		// Get all expired codes
		const { docs: expiredCodes } = await db.collection( 'codes' ).where( 'expires', '>', Date.now() ).get()

		// Log for reference
		console.log( `Deleting ${ expiredCodes.length } expired codes` )

		// Delete expired codes
		await Promise.all( expiredCodes.map( doc => doc.ref.delete() ) )

	} catch( e ) {
		console.error( 'deleteExpiredCodes error ', e )
	}

}
