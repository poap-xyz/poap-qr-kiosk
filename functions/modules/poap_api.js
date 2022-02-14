// Firebase interactors
const functions = require( 'firebase-functions' )
const { db, dataFromSnap, increment } = require( './firebase' )
const { log, dev } = require( './helpers' )

// Secrets
const { auth0 } = functions.config()

// Libraries
const fetch = require( 'isomorphic-fetch' )

// Get auth token from auth0
async function getAccessToken() {

	// Get API secrets
	const { access_token, expires } = await db.collection( 'secrets' ).doc( 'poap-api' ).get().then( dataFromSnap )
	const { client_id, client_secret, endpoint } = auth0

	// If token is valid for another hour, keep it
	if( expires > ( Date.now() + 1000 * 60 * 10 ) ) return access_token

	// If the access token expires soon, get a new one
	const options = {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify( {
			audience: auth0.audience,
			grant_type: 'client_credentials',
			client_id: client_id,
			client_secret: client_secret
		} )
	}
	log( `Getting access token at ${ endpoint } with `, options )
	const { access_token: new_access_token, expires_in, ...rest } = await fetch( endpoint, options ).then( res => res.json() )
	log( `New token: `, new_access_token, ' unexpected output: ', rest )

	// If no access token, error
	if( !new_access_token ) throw new Error( JSON.stringify( rest ) )

	// Set new token to firestore cache
	await db.collection( 'secrets' ).doc( 'poap-api' ).set( {
		access_token: new_access_token,
		expires: Date.now() + ( expires_in * 1000 ),
		updated: Date.now()
	}, { merge: true } )

	return new_access_token

}


// Health helper
exports.live_access_token = async f => {

	const token = await getAccessToken()
	return !!token

}

/**
* Authenticated API call in JSON format
* @returns {Object} response API response as documented at https://api.poap.xyz/documentation/static/index.html#/ and https://github.com/poap-xyz/poap-server/blob/development/src/apps/events/routes.ts#L57
* @returns {string} response.error Error message if one is given
* @returns {string} response.message Contains error details if this was an error
*/
exports.call_poap_endpoint = async ( endpoint='', data, method='GET', format='json' ) => {

		/* ///////////////////////////////
		// Validations */
		const has_non_get_data = ( method != 'GET' && data )
		const has_get_data = method == 'GET' && data
		const has_non_json_data = data && typeof data != 'object'
		if( has_non_json_data ) throw new Error( `API data must be formatted as json` )

		/* ///////////////////////////////
		// Generate API url */
		let apiUrl = dev ? 'https://dev-api.poap.tech' : 'https://api.poap.tech'
		if( has_get_data ) {

			const queryString = Object.keys( data ).reduce( ( acc, key ) => {

				return acc + `${ key }=${ data[ key ] }&`

			}, '?' )

			// Append querystring to url
			endpoint += queryString

		}

		/* ///////////////////////////////
		// Authentication */
		const access_token = await getAccessToken()
		log( `Calling ${ apiUrl }${ endpoint } with token ${ access_token?.slice( 0, 10 ) } and data ${ data && Object.keys( data ).join( ', ' ) }` )

		/* ///////////////////////////////
		// Call the API
		// /////////////////////////////*/

		// Build headers
		let headers = {
			Authorization: `Bearer ${ access_token }`,

			// If this is a request with json data
			...( has_non_get_data && format == 'json' && { "Content-Type": "application/json" } )

		}

		// Build data format
		let request_data = {}
		// if( data.image ) data.image = Buffer.from( data.image, 'base64' ).toString( 'binary' )
		if( has_non_get_data && format == 'json' ) request_data.body = JSON.stringify( data )



		// Execute request
		const url = `${ apiUrl }${ endpoint }`
		const options = {
			method: method,
			headers: headers,
			...request_data
		}
		log( `Calling ${ url } with `, options )
		const res = await fetch( url, options )

		// Parse the response
		try {

			// Try to access response as json first
			const json = await res.json()
			log( 'API json response: ', json )
			return json

		} catch {

			// If json fails, try as text
			const text = await res.text()
			log( 'API text response: ', text )
			return {
				error: `Error calling ${ apiUrl }`,
				message: text
			}

	}


}