const { db, dataFromSnap, increment } = require( './firebase' )
const app = require( './express' )()
const { generate_new_event_public_auth } = require( './events' )

// Configs
const functions = require( 'firebase-functions' )
const { kiosk } = functions.config()

app.get( '/claim/:event_id/:public_auth_token', async ( req, res ) => {

	try {

		// Check whether this request came from a CI instance, set the relevant return URL based on that
		const { CI } = req.query
		const redirect_baseurl = CI ? `http://localhost:3000/` : kiosk.public_url

		// Check whether the event needs new auth data
		const { event_id, public_auth_token } = req.params
		const event = await db.collection( 'events' ).doc( event_id ).get().then( dataFromSnap )

		// If the auth expired, write a new one but let the current scanner continue
		if( event.public_auth?.expires < Date.now() ) {
			await db.collection( 'events' ).doc( event_id ).set( {
				public_auth: generate_new_event_public_auth()
			}, { merge: true } )
		}

		// Get the code from the url
		if( !event_id || !public_auth_token ) return res.redirect( 307, `${ redirect_baseurl }/#/claim/robot` )

		// Check whether the auth token is still valid
		if( event.public_auth.token != public_auth_token ) return res.redirect( 307, `${ redirect_baseurl }/#/claim/robot` )

		// Write a challenge ID to the cache with an expired
		const challenge_auth = generate_new_event_public_auth()
		await db.collection( 'claim_challenges' ).doc( challenge_auth.token ).set( {
			eventId: event_id,
			...challenge_auth,
			challenges: event.challenges || [ 'game' ]
		} )

		// Return a redirect to the QR POAP app
		// 307: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_redirection
		return res.redirect( 307, `${ redirect_baseurl }/#/claim/${ challenge_auth.token }` )

	} catch( e ) {

		console.error( '/claim/:event_id/:public_auth_token error', e )
		return res.send( `Error validating your QR` )

	}

} )

// app.get( '/claim/:code/:eventId?', async ( req, res ) => {

// 	try {

// 		// How many times may a code be scanned before it is considered malicious?
// 		const abuseTreshold = 20

// 		// Get the code from the url
// 		const { code, eventId } = req.params
// 		if( !code ) throw new Error( `No code in request` )

// 		// Mark this code as unknown status, but mark true for testing environment
// 		await db.collection( 'codes' ).doc( code ).set( {
// 			updated: Date.now(),
// 			scanned: true,
// 			claimed: code.includes( 'testing' ) ? true : 'unknown',
// 			timesScanned: increment( 1 )
// 		}, { merge: true } )

// 		// If this is a streaming-mode request, grab a code from the bottom ot the queue instead
// 		if( eventId ) {

// 			// Check this code for abuse
// 			const { claimed, timesScanned } = await db.collection( 'codes' ).get().then( dataFromSnap ) 

// 			// If this code was claimed or is overused, redirect to jail
// 			if( claimed || timesScanned > abuseTreshold ) return res.redirect( 307, `${ kiosk.public_url }/#/claim/robot` ) 

// 			// Grab code in the reverse orderBy from frontend/src/modules/firebase.js
// 			const [ oldestCode ] = await db.collection( 'codes' )
// 															.where( 'event', '==', eventId )
// 															.where( 'claimed', '==', false )
// 															.orderBy( 'updated', 'desc' )
// 															.limit( 1 ).get().then( dataFromSnap )

// 			// Mark oldest code as unknown status
// 			await db.collection( 'codes' ).doc( oldestCode.uid ).set( {
// 				updated: Date.now(),
// 				scanned: true,
// 				claimed: code.includes( 'testing' ) ? true : 'unknown'
// 			}, { merge: true } )

// 			// Return a forward URL for the new code
// 			return res.redirect( 307, `${ kiosk.public_url }/#/claim/${ oldestCode.uid }` )

// 		}

// 		// Return a redirect to the POAP app
// 		// 307: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_redirection
// 		return res.redirect( 307, `${ kiosk.public_url }/#/claim/${ code }` )

// 	} catch( e ) {

// 		console.error( '/claim/:code error', e )
// 		return res.send( `Error validating your code` )

// 	}

// } )

module.exports = app
