// Firebase interactors
const functions = require( 'firebase-functions' )
const { db, dataFromSnap, increment } = require( './firebase' )
const dev = !!process.env.development
// Secrets
const { auth0 } = functions.config()

// Libraries
const fetch = require( 'isomorphic-fetch' )
const Throttle = require( 'promise-parallel-throttle' )

// ///////////////////////////////
// Code helpers
// ///////////////////////////////

// Get auth token from auth0
async function getAccessToken() {

	// Get API secrets
	const { access_token, expires } = await db.collection( 'secrets' ).doc( 'poap-api' ).get().then( dataFromSnap )
	const { client_id, client_secret, endpoint } = auth0

	// If token is valid for another hour, keep it
	if( expires > ( Date.now() + 1000 * 60 * 10 ) ) return access_token

	// If the access token expires soon, get a new one
	const options = {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify( {
			audience: 'POAP-QR-Kiosk',
			grant_type: 'client_credentials',
			client_id: client_id,
			client_secret: client_secret
		} )
	}
	const { access_token: new_access_token, expires_in } = await fetch( endpoint, options ).then( res => res.json() )

	// Set new token to firestore cache
	await db.collection( 'secrets' ).doc( 'poap-api' ).set( {
		access_token: new_access_token,
		expires: Date.now() + ( expires_in * 1000 ),
		updated: Date.now()
	}, { merge: true } )

	return new_access_token


}

// Remote api checker, this ALWAYS resolves
// this is because I am not sure that this API will not suddenly be throttled or authenticated.
const checkCodeStatus = async code => {

	// Testing data for CI
	const tomorrow = new Date( Date.now() + 1000 * 60 * 60 * 24 )
	const dayMonthYear = `${ tomorrow.getDate() }-${ tomorrow.toString().match( /(?:\w* )([A-Z]{1}[a-z]{2})/ )[1] }-${ tomorrow.getFullYear() }`
	
	// For testing codes, always reset on refresh
	if( code.includes( 'testing' ) ) return { claimed: false, event: { end_date: dayMonthYear, name: `Test Event ${ Math.random() }` } }

	// Get API data
	const apiUrl = dev ? 'https://dev-api.poap.tech' : 'https://api.poap.tech'
	const access_token = await getAccessToken()
	if( dev ) console.log( `Calling ${ apiUrl } with token ${ access_token }` )

	return fetch( `${ apiUrl }/actions/claim-qr?qr_hash=${ code }`, {
		headers: {
			Authorization: `Bearer ${ access_token }`
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
			error: `checkCodeStatus error`,
			message: e.message
		}
	} )
}

// Code updater
async function updateCodeStatus( code, cachedResponse ) {

	if( !code ) return

	// Check claim status on claim backend
	let { claimed, error, message, Message } = cachedResponse || await checkCodeStatus( code )

	// The api is unpredictable with error/message keys, the message should only ever happen inthe case of an error
	let readableError = ''
	if( !error && message ) readableError = message
	if( !error && Message ) readableError = Message
	if( error ) readableError = `${ error } - ${ message || Message }`

	// Formulate updates
	const updates = { updated: Date.now() }

	// If there was an error, append it to the code
	if( error || message || Message ) {
		updates.error = readableError
	} else { 

		// If no error then set the claimed status and update counter
		updates.claimed = !!claimed

		// Track how many times this code has been updated from the api
		updates.amountOfRemoteStatusChecks = increment( 1 )
		updates.lastRemoteStatusCheck = Date.now()

	}
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

/* ///////////////////////////////
// Get event data from code
// /////////////////////////////*/
exports.getEventDataFromCode = async function ( code, context ) {

	try {

		if( context.app == undefined ) {
			throw new Error( `App context error` )
		}

		// Get code meta from API
		const { event, error, message } = await checkCodeStatus( code )

		// Return only the event portion
		return { event, error: error && `${error}, ${message}` }


	} catch( e ) {
		console.error( 'getEventDataFromCode error: ', e )
		return { error: e.message }
	}

}

// ///////////////////////////////
// Manual code check
// ///////////////////////////////
exports.checkIfCodeHasBeenClaimed = async ( code, context ) => {

	try {

		if( context.app == undefined ) {
			throw new Error( `App context error` )
		}

		// Check claim status on claim backend
		const status = await checkCodeStatus( code )
		const { claimed, error } = status

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
	// const ageInMins = source == 'cron' ? 5 : 0

	// These are some sane defaults to prevent complete DOSsing
	const ageInSeconds = 5 * 60
	const ageInMs = 1000 * ageInSeconds
	const errorSlowdownFactor = 10
	const maxInProgress = 10


	try {

		// Appcheck validation
		if( context.app == undefined ) {
			throw new Error( `App context error` )
		}

		// Get old unknown codes
		const oldUnknowns = await db.collection( 'codes' ).where( 'claimed', '==', 'unknown' ).where( 'updated', '<', Date.now() - ageInMs ).get().then( dataFromSnap )
		const uncheckedCodes = await db.collection( 'codes' ).where( 'amountOfRemoteStatusChecks', '==', 0 ).get().then( dataFromSnap )
		const [ clean, withErrors ] = oldUnknowns.reduce( ( acc, val ) => {

			const [ cleanAcc, errorAcc ] = acc
			if( val.error ) return [ cleanAcc, [ ...errorAcc, val ] ]
			else return [ [ ...cleanAcc, val ], errorAcc ]

		}, [ [], [] ] )

		// Make the error checking slower
		const olderWithErrors = withErrors.filter( ( { updated } ) => updated < ( Date.now() - ( ageInMs * errorSlowdownFactor ) ) )

		// Build action queue
		const queue = [ ...uncheckedCodes, ...clean, ...olderWithErrors ].map( ( { uid } ) => function() {

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
	const checkCodesAtLeast = 2
	const codeResetTimeout = fiveMinutes
	const checkCooldown = 1000 * 30
	const maxInProgress = 10


	try {

		// Appcheck validation
		if( !dev && context.app == undefined ) {
			console.log( context.app )
			throw new Error( `App context error` )
		}


		// Codes that have been scanned and have not been claimed
		const scannedAndUnclaimedCodes = await db.collection( 'codes' )
									.where( 'event', '==', eventId )
									.where( 'scanned', '==', true )
									.where( 'claimed', '==', false )
									.get().then( dataFromSnap )

		// Grab codes that have been checked and are old enough
		const codesToReset = scannedAndUnclaimedCodes.filter( ( { amountOfRemoteStatusChecks, lastRemoteStatusCheck, } ) => amountOfRemoteStatusChecks > checkCodesAtLeast && lastRemoteStatusCheck < ( Date.now() - codeResetTimeout ) )
		await Promise.all( codesToReset.map( ( { uid } ) => db.collection( 'codes' ).doc( uid ).set( {
			scanned: false,
			amountOfRemoteStatusChecks: 0
		}, { merge: true } ) ) )

		// Filter out codes that were checked within the throttle interval. This may be useful if there are 50 ipads at an event and they all trigger rechecks.
		const codesToCheck = scannedAndUnclaimedCodes.filter( ( { updated } ) => updated < ( Date.now() - checkCooldown ) )

		// Build action queue
		const queue = codesToCheck.map( ( { uid } ) => function() {

			return updateCodeStatus( uid )

		} )

		// For every unknown, check the status against live API
		await Throttle.all( queue, {
			maxInProgress: maxInProgress
		} )

		return { updated: codesToCheck.length, reset: codesToReset.length }


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

	// Exit on deletion or creation
	if( !after.exists || !before.exists ) return

	const { codeId } = context.params
	const { claimed: prevClaimed } = before.data() || {}
	const { event, claimed } = after.data()

	// Do nothing if no change
	if( prevClaimed === claimed ) return

	// Scenarios:
	// false > unknown = -1
	// false > true = -1
	// unknown > true = 0
	// true > false = +1
	// unknown > false = +1

	if( prevClaimed === false && [ 'unknown', true ].includes( claimed ) ) {
		return db.collection( 'publicEventData' ).doc( event ).set( { codesAvailable: increment( -1 ), updated: Date.now() }, { merge: true } )
	}
	
	if( [ true, 'unknown' ].includes( prevClaimed ) && claimed === false ) {
		return db.collection( 'publicEventData' ).doc( event ).set( { codesAvailable: increment( 1 ), updated: Date.now() }, { merge: true } )
	}	


}

// ///////////////////////////////
// Delete expired codes
// ///////////////////////////////
exports.deleteExpiredCodes = async () => {


	try {

		// An extra day of expiry distance in case of timezone weirdness
		const dayInMs = 1000 * 60 * 60 * 24

		// Get all expired codes
		const { docs: expiredCodes } = await db.collection( 'codes' ).where( 'expires', '>', Date.now() + dayInMs ).get()

		// Log for reference
		console.log( `Deleting ${ expiredCodes.length } expired codes` )

		// Delete expired codes
		await Promise.all( expiredCodes.map( doc => doc.ref.delete() ) )

	} catch( e ) {
		console.error( 'deleteExpiredCodes error ', e )
	}

}
