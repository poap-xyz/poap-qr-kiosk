const { live_access_token, call_poap_endpoint } = require( './poap_api' ) 
const { log } = require( './helpers' )

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