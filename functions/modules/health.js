const { live_access_token, call_poap_endpoint } = require( './poap_api' ) 
const { log, wait, throttle_and_retry } = require( './helpers' )
const { db, dataFromSnap } = require( './firebase' )

const health_check = async () => {

	const status = {
		healthy: false,
		poap_api: false,
		poap_api_auth: false
	}

	try {

		// Check if we have an access token to the POAP API
		const has_token = await live_access_token().catch( e => {
			log( e )
			return false
		} )

		// Check the self-reported health of the POAP api
		const api_health = await call_poap_endpoint( `/health-check` ).catch( e => {
			log( e )
			return false
		} )

		// Update status object to reflect new data
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

exports.health_check = health_check

exports.public_health_check = async ( req, res ) => {

	try {

		const status =  await health_check()
		return res.json( status )

	} catch( e ) {
		return res.json( { error: e.message } )
	}

}

exports.clean_up_expired_items = async () => {

	const maxInProgress = 500
	const day_in_ms = 1000 * 60 * 60 * 24
	const time_to_keep_after_expiry = day_in_ms * 30

	try {

		/* ///////////////////////////////
		// Grab expired events */
		const grace_period_events = Date.now() - time_to_keep_after_expiry
		const { docs: expired_events } = await db.collection( 'events' ).where( 'expires', '<', grace_period_events ).get()

		console.log( `${ expired_events.length } expired events` )

		// Generate action queue
		const event_deletion_queue = expired_events.map( doc => () => doc.ref.delete() )

		// Throttled delete
		await throttle_and_retry( event_deletion_queue, maxInProgress, `event deletion`, 5, 5 )

		/* ///////////////////////////////
		// Delete orphaned data */
		const grace_period_orphans = Date.now() - ( time_to_keep_after_expiry * 2 )
		const { docs: expired_challenges } = await db.collection( 'claim_challenges' ).where( 'expires', '<', grace_period_orphans ).get()
		const { docs: expired_codes } = await db.collection( 'codes' ).where( 'expires', '<', grace_period_orphans ).get()
		const { docs: expired_ci_claims } = await db.collection( 'static_drop_claims' ).where( 'is_mock_claim', '==', true ).where( 'expires', '<', grace_period_orphans ).get()

		console.log( `${ expired_challenges.length } expired challenges` )
		console.log( `${ expired_codes.length } expired codes` )
		console.log( `${ expired_ci_claims } expired CI claims` )

		// Generate action queue
		const orphan_deletion_queue = [ ...expired_challenges, ...expired_codes, ...expired_ci_claims ].map( doc => () => doc.ref.delete() )

		// Throttled delete
		await throttle_and_retry( orphan_deletion_queue, maxInProgress, `orphan deletion`, 5, 5 )

		console.log( `Successfully deleted ${expired_events.length } events, ${ expired_codes.length } codes, ${ expired_challenges.length } challenges` )


	} catch( e ) {
		console.error( 'deleteExpiredCodes error ', e )
	}

}