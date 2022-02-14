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

module.exports = app
