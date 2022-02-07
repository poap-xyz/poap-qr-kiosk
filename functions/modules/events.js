// Firebase interactors
const { db, dataFromSnap } = require( './firebase' )
const { v4: uuidv4 } = require('uuid')
const { sendEventAdminEmail } = require( './email' )

// Configs
const functions = require( 'firebase-functions' )
const { kiosk } = functions.config()

// Public auth helper, used here and in the claimcode handler
const generate_new_event_public_auth = ( expires_in_minutes=2, is_test_event=false ) => ( {
	token: is_test_event ? `testing-${ uuidv4() }` : uuidv4(),
	expires: Date.now() + ( expires_in_minutes * 1000 * 60 ),
	created: Date.now()
} )
exports.generate_new_event_public_auth = generate_new_event_public_auth

exports.registerEvent = async function( data, context ) {
	
	try {

		// Add a week grace period in case we need to debug anything
		const weekInMs = 1000 * 60 * 60 * 24 * 7

		// Appcheck validation
		if( context.app == undefined ) {
			console.log( context )
			throw new Error( `App context error` )
		}

		// Validations
		const { name='', email='', date='', codes=[], challenges=[] } = data
		if( !codes.length ) throw new Error( 'Csv has 0 entries' )
		if( !name.length ) throw new Error( 'Please specify an event name' )
		if( !email.includes( '@' ) ) throw new Error( 'Please specify a valid email address' )
		if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( 'Please specify the date in YYYY-MM-DD, for example 2021-11-25' )

		// Create event document
		const authToken = uuidv4()
		const is_test_event = codes.find( code => code.includes( 'testing' ) )
		const { id } = await db.collection( 'events' ).add( {
			name,
			email,
			expires: new Date( date ).getTime() + weekInMs, // Event expiration plus a day
			expires_yyyy_mm_dd: date,
			codes: codes.length,
			codesAvailable: 0, // This will be updated by the initial scan run in codes.js:updatePublicEventAvailableCodes
			authToken,
			challenges,
			public_auth: generate_new_event_public_auth( 5, is_test_event ),
			created: Date.now(),
			updated: Date.now()
		} )

		// Sanetise codes
		const saneCodes = codes.map( ( code='' ) => {

			// Remove web prefixes
			code = code.replace( /(https?:\/\/.*\/)/ig, '')

			if( !code.match( /\w{1,42}/ ) ) throw new Error( `Invalid code: ${ code }` )

			return code

		} ).filter( ( code='' ) => !!code.length )

		// First check if all codes are unused by another event
		await Promise.all( saneCodes.map( async code => {

			// Check if code already exists and is claimed
			const oldDocRef = await db.collection( 'codes' ).doc( code ).get()
			const oldDocData = oldDocRef.data()
			if( oldDocRef.exists && oldDocData.event != id ) throw new Error( `Code ${ code } is already in use by another event.` )

		} ) )

		// Load the codes into firestore
		await Promise.all( saneCodes.map( async code => {

			return db.collection( 'codes' ).doc( code ).set( {
				claimed: 'unknown',
				scanned: false,
				amountOfRemoteStatusChecks: 0,
				created: Date.now(),
				updated: Date.now(),
				event: id,
				expires: new Date( date ).getTime() + weekInMs
			}, { merge: true } )

		} ) )

		// Send email to user with event and admin links
		await sendEventAdminEmail( {
			email: email,
			event: {
				name,
				eventlink: `${ kiosk.public_url }/#/event/${ id }`,
				adminlink: `${ kiosk.public_url }/#/event/admin/${ id }/${ authToken }`
			}
		} )

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

	const { after } = change
	const { eventId } = context.params

	// If this was a deletion, delete public data
	if( !after.exists ) return db.collection( 'publicEventData' ).doc( eventId ).delete()

	// If this was an update, grab the public properties and set them
	const { name, codes, codesAvailable, expires, public_auth, challenges } = after.data()
	return db.collection( 'publicEventData' ).doc( eventId ).set( { name, public_auth, codes, expires, challenges, codesAvailable: codesAvailable || 0, updated: Date.now() }, { merge: true } )

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

exports.deleteCodesOfDeletedEvent = async function( snap, context ) {

	try {

		// Get parameters
		const { eventId } = context.params

		// Delete obsolete codes
		const snap = await db.collection( 'codes' ).where( 'event', '==', eventId ).get()
		await Promise.all( snap.docs.map( doc => doc.ref.delete() ) )

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