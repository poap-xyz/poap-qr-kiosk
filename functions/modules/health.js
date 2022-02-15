const { live_access_token, call_poap_endpoint } = require( './poap_api' ) 
const { log, wait } = require( './helpers' )
const { db } = require( './firebase' )
const Throttle = require( 'promise-parallel-throttle' )

exports.health_check = async () => {

	const status = {
		healthy: false,
		poap_api: false,
		poap_api_auth: false
	}

	try {

		const has_token = await live_access_token().catch( e => {
			log( e )
			return false
		} )
		const api_health = await call_poap_endpoint( `/health-check` ).catch( e => {
			log( e )
			return false
		} )

		status.healthy = !!( has_token && api_health )
		status.poap_api = !!api_health
		status.poap_api_auth = !!has_token

		return status

	} catch( e ) {
		return {
			...status,
			error: e.message
		}
	}

}

exports.clean_up_expired_items = async () => {

	const maxInProgress = 500

	try {

		// An extra day of expiry distance in case of timezone weirdness
		const dayInMs = 1000 * 60 * 60 * 24
		const twoDayInMs = 1000 * 60 * 60 * 24 * 2

		// Delete expired events
		const { docs: expiredEvents } = await db.collection( 'events' ).where( 'expires', '>', Date.now() + dayInMs ).get()
		const { docs: expiredChallenges } = await db.collection( 'claim_challenges' ).where( 'expires', '>', Date.now() + dayInMs ).get()

		console.log( `Deleting ${ expiredEvents.length } expired events and ${ expiredChallenges.length } expired challenges` )

		const event_and_challenge_queue = [ ...expiredEvents, ...expiredChallenges ].map( doc => () => doc.ref.delete() )

		// Throttled delete
		await Throttle.all( event_and_challenge_queue, { maxInProgress } )

		// Wait for 30 seconds after the throttle to make sure the codes that are linked are deleted
		await wait( 30000 )

		// Get all expired codes
		const { docs: expiredCodes } = await db.collection( 'events' ).where( 'expires', '>', Date.now() + twoDayInMs ).get()

		console.log( `Deleting ${ expiredCodes.length } expired codes` )

		// Delete expired codes
		await Throttle.all( expiredCodes.map( doc => () => doc.ref.delete() ), { maxInProgress } )

	} catch( e ) {
		console.error( 'deleteExpiredCodes error ', e )
	}

}
