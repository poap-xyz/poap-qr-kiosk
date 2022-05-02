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
		if( !event.uid ) throw new Error( `Event ${ event_id } does not exist` )

		// Get the code from the url
		if( !event_id || !public_auth_token ) return res.redirect( 307, `${ redirect_baseurl }/#/claim/robot` )

		// Check whether the auth token is still valid
		const previous_auth_grace_ms = 1000 * 10
		const { public_auth={}, previous_public_auth={} } = event || {}
		const valid_public_auth = public_auth?.token == public_auth_token
		const valid_previous_public_auth = previous_public_auth?.token == public_auth_token
		const previous_auth_within_grace_period = previous_public_auth?.expires < ( Date.now() + previous_auth_grace_ms )

		// If the auth is invalid AND the auth is not the previous auth within the grace period, mark as robot
		if( !valid_public_auth && !( valid_previous_public_auth && previous_auth_within_grace_period ) ) {

			return res.redirect( 307, `${ redirect_baseurl }/#/claim/robot/${ public_auth_token }_miss_${ valid_public_auth }_${ valid_previous_public_auth }_${ previous_auth_within_grace_period }` )

		}

		// Write a challenge ID to the cache with an expires setting of the game duration plus a grace period
		const challenge_grace_length_in_mins = 1
		const challenge_validity_in_mins = event?.game_config?.duration && ( challenge_grace_length_in_mins + ( event?.game_config?.duration / 60 ) )
		const challenge_auth = generate_new_event_public_auth( challenge_validity_in_mins || 2 )
		await db.collection( 'claim_challenges' ).doc( challenge_auth.token ).set( {
			eventId: event_id,
			...challenge_auth,
			challenges: event.challenges || [ 'game' ],
			game_config: event.game_config || { duration: 30, target_score: 5 }
		} )

		// If the auth expired, write a new one but only after the current scanner was let through
		if( event.public_auth?.expires < Date.now() ) {

			// Write new public auth AND save previous
			await db.collection( 'events' ).doc( event_id ).set( {
				public_auth: generate_new_event_public_auth(),
				previous_public_auth: event?.public_auth || {}
			}, { merge: true } )
		}

		// Return a redirect to the QR POAP app
		// 307: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_redirection
		return res.redirect( 307, `${ redirect_baseurl }/#/claim/${ challenge_auth.token }` )

	} catch( e ) {

		const { event_id, public_auth_token } = req.params || {}
		console.error( `/claim/${ event_id }/${ public_auth_token } error`, e )
		return res.send( `Error validating your QR` )

	}

} )

module.exports = app
