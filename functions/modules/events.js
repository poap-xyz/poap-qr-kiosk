// Firebase interactors
const { db, dataFromSnap } = require( './firebase' )
const { v4: uuidv4 } = require('uuid')

exports.registerEvent = async function( data, context ) {
	
	try {

		// Validations
		const { name='', email='', date='', codes=[] } = data
		if( !codes.length ) throw new Error( 'Csv has 0 entries' )
		if( !name.length ) throw new Error( 'Please specify an event name' )
		if( !email.includes( '@' ) ) throw new Error( 'Please specify a valid email address' )
		if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( 'Please specify the date in YYYY-MM-DD, for example 2021-11-25' )

		// Create event document
		const authToken = uuidv4()
		const { id } = await db.collection( 'events' ).add( {
			name,
			email,
			expires: date,
			codes: codes.length,
			authToken
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
			console.log( 'Getting doc...' )
			const oldDocRef = await db.collection( 'codes' ).doc( code ).get()
			const oldDocData = oldDocRef.data()
			if( oldDocRef.exists && oldDocData.event != id ) throw new Error( `Code ${ code } is already in use by another event.` )

		} ) )

		// Load the codes into firestore
		await Promise.all( saneCodes.map( async code => {

			return db.collection( 'codes' ).doc( code ).set( {
				claimed: 'unknown',
				created: Date.now(),
				updated: Date.now(),
				event: id,
				expires: date
			} )

		} ) )

		// TODO: send email to user with event and admin links 

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

exports.deleteEvent = async function( data, context ) {
	
	try {

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

		const { eventId } = context.params

		// Delete obsolete codes
		const snap = await db.collection( 'codes' ).where( 'event', '==', eventId ).get()
		await Promise.all( snap.docs.map( doc => doc.ref.delete() ) )

	} catch( e ) {
		console.error( 'deleteCodesOfDeletedEvent error: ', e )
	}

}