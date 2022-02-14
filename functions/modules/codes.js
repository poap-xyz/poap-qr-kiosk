// Firebase interactors
const functions = require( 'firebase-functions' )
const { db, dataFromSnap, increment } = require( './firebase' )
const { log, dev } = require( './helpers' )

const { call_poap_endpoint } = require( './poap_api' )

// Libraries
const Throttle = require( 'promise-parallel-throttle' )

// ///////////////////////////////
// Code helpers
// ///////////////////////////////

// Remote api checker, this ALWAYS resolves
// this is because I am not sure that this API will not suddenly be throttled or authenticated.
const checkCodeStatus = async code => {

	// Testing data for CI
	const tomorrow = new Date( Date.now() + 1000 * 60 * 60 * 24 )
	const dayMonthYear = `${ tomorrow.getDate() }-${ tomorrow.toString().match( /(?:\w* )([A-Z]{1}[a-z]{2})/ )[1] }-${ tomorrow.getFullYear() }`
	
	// For testing codes, always reset on refresh
	if( code.includes( 'testing' ) ) return { claimed: false, event: { end_date: dayMonthYear, name: `Test Event ${ Math.random() }` } }

	// Get API data
	return call_poap_endpoint( `/actions/claim-qr`, { qr_hash: code } )

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
		}, { merge: true } )

		// Track by error
		await db.collection( 'errors' ).doc( error ).set( {
			updated: Date.now(),
			strikes: increment( 1 ),
			message: message || ''
		}, { merge: true } ).catch( e => {
			// This might happen if the remote error code has weird characters
			console.error( 'Unable to write error ', e )
		} )

	}

	// Set updated status to firestore
	await db.collection( 'codes' ).doc( code ).set( updates, { merge: true } )

	// Return the status for use in other places
	return updates.claimed

}

/* ///////////////////////////////
// Get event data from code
// /////////////////////////////*/
exports.getEventDataFromCode = async function ( code, context ) {

	try {

		// if( context.app == undefined ) {
		// 	throw new Error( `App context error` )
		// }

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
// Check status of old unknowns
// ///////////////////////////////
exports.refresh_unknown_and_unscanned_codes = async ( event_id, context ) => {

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

		// Input validation
		if( !event_id ) throw new Error( `Event ID was not passed to refresh` )

		/* ///////////////////////////////
		// Clash throttle */
		const currently_running = await db.collection( 'meta' ).doc( `event_refresh_blocker_${ event_id }` ).get().then( dataFromSnap )

		// If there is a running refresh ...
		// and it is the first refresh ever (ie .ended exists)...
		// or this is not the first, but the last run did not finish yet ...
		if( currently_running && ( !currently_running.ended || currently_running.started > currently_running.ended ) ) {

			// ...and it is younger than 5 minutes, exit
			const five_minutes_from_now = Date.now() + ( 1000 * 60 * 5 )
			if( currently_running.started < five_minutes_from_now ) return

		}

		// Set this run as the running one
		await db.collection( 'meta' ).doc( `event_refresh_${ event_id }` ).set( { started: Date.now(), started_human: new Date().toString() }, { merge: true } )

		// Get old unknown codes
		const oldUnknowns = await db.collection( 'codes' )
								.where( 'claimed', '==', 'unknown' )
								.where( 'updated', '<', Date.now() - ageInMs )
								.where( 'eventId', '==', event_id )
								.get().then( dataFromSnap )

		// Get unchecked codes
		const uncheckedCodes = await db.collection( 'codes' )
								.where( 'amountOfRemoteStatusChecks', '==', 0 )
								.where( 'eventId', '==', event_id )
								.get().then( dataFromSnap )

		// Split codes with previous errors
		const [ clean, withErrors ] = oldUnknowns.reduce( ( acc, val ) => {

			const [ cleanAcc, errorAcc ] = acc
			if( val.error ) return [ cleanAcc, [ ...errorAcc, val ] ]
			else return [ [ ...cleanAcc, val ], errorAcc ]

		}, [ [], [] ] )

		// Make the error checking slower
		const olderWithErrors = withErrors.filter( ( { updated } ) => updated < ( Date.now() - ( ageInMs * errorSlowdownFactor ) ) )

		// Build action queue
		const old_unknown_queue = [ ...uncheckedCodes, ...clean, ...olderWithErrors ].map( ( { uid } ) => function() {

			return updateCodeStatus( uid )

		} )

		// Check old unknowns against the live API
		await Throttle.all( old_unknown_queue, {
			maxInProgress: maxInProgress
		} )

		// Build action queue
		const unscanned_queue = [ ...uncheckedCodes ].map( ( { uid } ) => function() {

			return updateCodeStatus( uid )

		} )

		// Check unscanned against live qpi
		const unscanned_statusses = await Throttle.all( unscanned_queue, {
			maxInProgress: maxInProgress
		} )

		// Update public event counter
		const codes_already_claimed = unscanned_statusses.reduce( ( acc, val ) => {
			if( val == true ) return acc + 1
			return acc
		}, 0 )

		// Increment event database
		await db.collection( 'events' ).doc( event_id ).set( { codesAvailable: increment( -codes_already_claimed ), updated: Date.now() }, { merge: true } )

		// Mark this run as finished
		await db.collection( 'meta' ).doc( `event_refresh_${ event_id }` ).set( { ended: Date.now(), ended_human: new Date().toString() }, { merge: true } )

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

exports.updateEventAvailableCodes = async function( change, context ) {

	const { before, after } = change

	// Exit on deletion or creation
	if( !after.exists || !before.exists ) return

	const { codeId } = context.params
	const { claimed: prevClaimed } = before.data() || {}
	const { event, claimed, amountOfRemoteStatusChecks } = after.data()

	// Do nothing if no change
	if( prevClaimed === claimed ) return

	// If this is the first update, do not increment the public event data
	// this is being done manually in refresh_unknown_and_unscanned_codes
	if( amountOfRemoteStatusChecks <= 1 ) return

	// Scenarios:
	// false > unknown = -1
	// false > true = -1
	// unknown > true = 0
	// true > false = +1
	// unknown > false = +1

	if( prevClaimed === false && [ 'unknown', true ].includes( claimed ) ) {
		return db.collection( 'events' ).doc( event ).set( { codesAvailable: increment( -1 ), updated: Date.now() }, { merge: true } )
	}
	
	if( [ true, 'unknown' ].includes( prevClaimed ) && claimed === false ) {
		return db.collection( 'events' ).doc( event ).set( { codesAvailable: increment( 1 ), updated: Date.now() }, { merge: true } )
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

/* ///////////////////////////////
// Get code based on valid challenge
// /////////////////////////////*/
exports.get_code_by_challenge = async ( challenge_id, context ) => {

	try {

		// Grace period for completion, this is additional to the window of generate_new_event_public_auth
		const grace_period_in_ms = 1000 * 5

		// Validate caller
		if( context.app == undefined ) {
			throw new Error( `App context error` )
		}

		// Get challenge
		const challenge = await db.collection( 'claim_challenges' ).doc( challenge_id ).get().then( dataFromSnap )
		
		// Check if challenge still exists
		if( !challenge || !challenge.eventId ) throw new Error( `This link was already used by somebody else, scan the QR code again please` )

		// Check if challenge expired already
		if( challenge.expires < ( Date.now() + grace_period_in_ms ) ) throw new Error( `This link expired, please make sure to claim your POAP right after scanning the QR.` )

		/* ///////////////////////////////
		// Get a verified available code */
		let valid_code = undefined
		while( !valid_code ) {

			// Grab oldest available code
			const [ oldestCode ] = await db.collection( 'codes' )
										.where( 'event', '==', challenge.eventId )
										.where( 'claimed', '==', false )
										.orderBy( 'updated', 'desc' )
										.limit( 1 ).get().then( dataFromSnap )

			if( !oldestCode || !oldestCode.uid ) throw new Error( `No more POAPs available for this event!` )

			// Mark oldest code as unknown status so other users don't get it suggested
			await db.collection( 'codes' ).doc( oldestCode.uid ).set( {
				updated: Date.now(),
				scanned: true,
				claimed: oldestCode.uid.includes( 'testing' ) ? true : 'unknown'
			}, { merge: true } )

			// Check whether the code is actuallt valid
			const is_available = await checkCodeStatus( oldestCode.uid )

			// If this code is confirmed available, send it to the user
			if( is_available ) valid_code = oldestCode

		}

		// Delete challenge to prevent reuse
		await db.collection( 'claim_challenges' ).doc( challenge_id ).delete()

		// Return valid code to the frontend
		return valid_code.uid

	} catch( e ) {

		return { error: e.message }

	}

}