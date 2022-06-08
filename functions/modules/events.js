// Firebase interactors
const { db, dataFromSnap, arrayUnion, increment } = require( './firebase' )
const { v4: uuidv4 } = require('uuid')
const { sendEventAdminEmail } = require( './email' )
const Throttle = require( 'promise-parallel-throttle' )
const { throttle_and_retry, log } = require( './helpers' )

// Configs
const functions = require( 'firebase-functions' )
const { call_poap_endpoint } = require('./poap_api')
const { kiosk } = functions.config()

// Public auth helper, used here and in the claimcode handler
const generate_new_event_public_auth = ( expires_in_minutes=2, is_test_event=false ) => ( {
	token: is_test_event ? `testing-${ uuidv4() }` : uuidv4(),
	expires: Date.now() + ( expires_in_minutes * 1000 * 60 ),
	expiry_interval: expires_in_minutes,
	created: Date.now()
} )
exports.generate_new_event_public_auth = generate_new_event_public_auth

/**
* Helper that sanitises codes and writes them to the database, but errors if there is a clash
* @param {string} event_id The id of the event that these codes belong to
* @param {number} expiration_date Timestamp of the expiration date of the event
* @param {{qr_hash: String, claimed: Boolean}[]} codes An array of codes to sanitise, validate and save to the firestore
* @param {{qr_hash: String, claimed: Boolean}[]} existing_codes An array of codes to expect to already exist
* @returns {Promise<array>} codes An array of the codes written to the database
* @throws {Error} error Throws if anything failed
*/
async function validate_and_write_event_codes( event_id, expiration_date, codes, existing_codes=[] ) {

	log( `Writing ${ codes?.length } (of which ${ existing_codes?.length } old) for event ${ event_id } (expired ${ expiration_date })` )

	// Add a week grace period in case we need to debug anything
	const weekInMs = 1000 * 60 * 60 * 24 * 7

	// Throttle config
	const maxInProgress = 500


	/* ///////////////////////////////
	// Step 1: validations and clash handling */
	
	// Sanetise codes
	const saneCodes = codes.map( code => {

		let { qr_hash } = code
		const { claimed } = code

		if( !qr_hash ) throw new Error( `Malformed code input` )

		// Remove web prefixes
		qr_hash = qr_hash.replace( /(https?:\/\/.*\/)/ig, '')

		// Make sure hash matches wallet hash length
		if( !qr_hash.match( /\w{1,42}/ ) ) throw new Error( `Invalid code: ${ qr_hash }` )

		return { qr_hash, claimed }

	} ).filter( ( { qr_hash } ) => !!qr_hash.length )

	// Parse out codes that are expected to be new, so keep only codes that are not found in the existing_code array
	const new_codes = saneCodes.filter( ( { qr_hash } ) => !existing_codes?.find( existing_code => existing_code.qr_hash == qr_hash ) )
	// First check if all codes are unused by another event
	const code_clash_queue = new_codes.map( code => async () => {

		// Check if code already exists and is claimed
		const oldDocRef = await db.collection( 'codes' ).doc( code.qr_hash ).get()
		const oldDocData = oldDocRef.data()
		if( oldDocRef.exists && oldDocData.event != event_id ) throw new Error( `This QR Dispenser has already been created! If you were the creator, please check your email for a message with the subject "POAP - Your QR Kiosk".\nDebug data for POAP programmers: duplicate entry is ${ code }..` )

	} )

	/* ///////////////////////////////
	// Step 2: Throttled code writing, see https://cloud.google.com/firestore/docs/best-practices and https://cloud.google.com/firestore/quotas#writes_and_transactions */
	
	// Check for code clashes in a throttled manner
	await Throttle.all( code_clash_queue, { maxInProgress } )

	// Load the codes into firestore
	const code_writing_queue = saneCodes.map( code => async () => {

		return db.collection( 'codes' ).doc( code.qr_hash ).set( {
			claimed: !!code.claimed,
			scanned: false,
			amountOfRemoteStatusChecks: 0,
			created: Date.now(),
			updated: Date.now(),
			updated_human: new Date().toString(),
			event: event_id,
			expires: new Date( expiration_date ).getTime() + weekInMs
		}, { merge: true } )

	} )

	// Write codes to firestore with a throttle
	await Throttle.all( code_writing_queue, { maxInProgress } )

	// Return the sanitised codes
	return saneCodes

}
exports.validate_and_write_event_codes = validate_and_write_event_codes

/**
* Get the event template by event ID
* @param {string} an_event_qr_hash - One of the codes belonging to the event
* @returns {object} template_data - empty object if none, details if exists: https://documentation.poap.tech/reference/getevent-templates-3 
*/
async function get_event_template_by_code( an_event_qr_hash ) {

	try {

		// Get event ID as known within the POAP system
		const { event } = await call_poap_endpoint( `/actions/claim-qr`, { qr_hash: an_event_qr_hash } )
		const { event_template_id } = event

		// If no template data, return empty
		if( !event_template_id ) return {}

		// Grab template data
		const template_data = await call_poap_endpoint( `/event-templates/${ event_template_id }` )
		log( `Template id ${ event_template_id } is called ${ template_data.name }` )

		return template_data

	} catch( e ) {

		log( `get_event_template_if_exists error: `, e )
		throw new Error( `Could not load event template: ${ e.message }` )

	}

}
exports.get_event_template_by_code = get_event_template_by_code

exports.registerEvent = async function( data, context ) {
	
	try {

		// Add a week grace period in case we need to debug anything
		const weekInMs = 1000 * 60 * 60 * 24 * 7

		// Appcheck validation
		if( context.app == undefined ) {
			throw new Error( `App context error` )
		}

		// Validations
		const { name='', email='', date='', codes=[], challenges=[], game_config={ duration: 30, target_score: 5 } } = data
		if( !codes.length ) throw new Error( 'Csv has 0 entries' )
		if( !name.length ) throw new Error( 'Please specify an event name' )
		if( !email.includes( '@' ) ) throw new Error( 'Please specify a valid email address' )
		if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( 'Please specify the date in YYYY-MM-DD, for example 2021-11-25' )

		// Create event document
		const authToken = uuidv4()
		const is_test_event = codes.find( code => code.includes( 'testing' ) )
		const public_auth_expiry_interval_minutes = is_test_event ? .5 : 2
		const { id } = await db.collection( 'events' ).add( {
			name,
			email,
			expires: new Date( date ).getTime() + weekInMs, // Event expiration plus a week
			expires_yyyy_mm_dd: date,
			codes: codes.length,
			codesAvailable: codes.length, // This will be updated by the initial scan run in codes.js:updatePublicEventAvailableCodes
			authToken,
			challenges,
			game_config,
			template: await get_event_template_by_code( codes[0] ),
			public_auth: generate_new_event_public_auth( public_auth_expiry_interval_minutes, is_test_event ),
			created: Date.now(),
			updated: Date.now()
		} )

		// Format codes to the helpers understand the format
		const formatted_codes = codes.map( qr_hash => ( { qr_hash } ) )

		// Check code validity and write to firestore
		await validate_and_write_event_codes( id, date, formatted_codes )

		// Send email to user with event and admin links
		await sendEventAdminEmail( {
			email: email,
			event: {
				name,
				eventlink: `${ kiosk.public_url }/#/event/${ id }`,
				adminlink: `${ kiosk.public_url }/#/event/admin/${ id }/${ authToken }`
			}
		} )

		// Keep track of event admin emails
		await db.collection( 'user_data' ).doc( email ).set( {
			events: arrayUnion( id ),
			events_organised: increment( 1 ),
			updated: Date.now(),
			updated_human: new Date().toString()
		}, { merge: true } )

		// Return event data
		return {
			id,
			name,
			authToken
		}


	} catch( e ) {

		console.error( 'createEvent error ', e )
		return { error: e.message }

	}


}

exports.updatePublicEventData = async function( change, context ) {

	const { after, before } = change
	const { eventId } = context.params

	// If this was a deletion, delete public data
	if( !after.exists ) return db.collection( 'publicEventData' ).doc( eventId ).delete()

	// If this was an update, grab the public properties and set them
	const { name, codes, codesAvailable, expires, public_auth, challenges, game_config, template } = after.data()
	const public_data_object = {
		name,
		public_auth,
		codes,
		expires,
		challenges,
		game_config,
		...( template && { template } ),
		codesAvailable: codesAvailable || 0,
		updated: Date.now()
	}
	return db.collection( 'publicEventData' ).doc( eventId ).set( public_data_object, { merge: true } )

}

exports.deleteEvent = async function( data, context ) {
	
	try {

		if( context.app == undefined ) {
			throw new Error( `App context error` )
		}

		// Validations
		const { eventId, authToken } = data

		// Check if authorisation is correct
		const { authToken: eventAuthToken } = await db.collection( 'events' ).doc( eventId ).get().then( dataFromSnap )
		if( authToken != eventAuthToken ) throw new Error( `Invalid admin code` )
		
		// If it is correct, delete the event (which triggers the deletion of codes)
		await db.collection( 'events' ).doc( eventId ).delete()

		return {
			deleted: eventId
		}


	} catch( e ) {

		console.error( 'createEvent error ', e )
		return { error: e.message }

	}


}

exports.delete_data_of_deleted_event = async function( snap, context ) {

	// Throttle config
	const maxInProgress = 500

	try {

		// Get parameters
		const { eventId } = context.params

		/* ///////////////////////////////
		// Delete obsolete codes & challenges */

		// Grab codes and challenges of deleted event
		const { docs: codes_snap } = await db.collection( 'codes' ).where( 'event', '==', eventId ).get()
		const { docs: challenges_snap } = await db.collection( 'claim_challenges' ).where( 'eventId', '==', eventId ).get()

		const deletion_queue = [ ...codes_snap, ...challenges_snap ].map( doc => () => doc.ref.delete() )
		await throttle_and_retry( deletion_queue, maxInProgress, `delete data of deleted event`, 5, 5 )

	} catch( e ) {
		console.error( 'deleteCodesOfDeletedEvent error: ', e )
	}

}

exports.getUniqueOrganiserEmails = async function(  ) {

	try {

		if( !process.env.development ) return console.error( 'getUniqueOrganiserEmails called externally which is never allowed' )

		const events = await db.collection( 'events' ).get().then( dataFromSnap )
		const emails = events.map( ( { email } ) => email )
		const uniqueEmails = []
		emails.map( email => {
			if( uniqueEmails.includes( email ) ) return
			uniqueEmails.push( email )
		} )
		
		return uniqueEmails

	} catch( e ) {
		console.error( e )
	}

}
