// Firebase interactors
const { db, dataFromSnap } = require( './firebase' )
const { log } = require( './helpers' )

// Secrets
const { POAP_API_KEY, AUTH0_CLIENT_ID, AUTH0_ENDPOINT, AUTH0_CLIENT_SECRET, AUTH0_AUDIENCE } = process.env

// Libraries
const fetch = require( 'isomorphic-fetch' )

// Get auth token from auth0
async function getAccessToken() {

    // Get API secrets
    const { access_token, expires } = await db.collection( 'secrets' ).doc( 'poap-api' ).get().then( dataFromSnap )

    // If token is valid for another hour, keep it
    if( expires >  Date.now() + 1000 * 60 * 10  ) return access_token

    // If the access token expires soon, get a new one
    const options = {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( {
            audience: AUTH0_AUDIENCE,
            grant_type: 'client_credentials',
            client_id: AUTH0_CLIENT_ID,
            client_secret: AUTH0_CLIENT_SECRET
        } )
    }
    log( `Getting access token at ${ AUTH0_ENDPOINT } with `, options )
    const auth_response = await fetch( AUTH0_ENDPOINT, options )
    const backup_res = auth_response.clone()
    
    // Parse the response
    try {

        const { access_token: new_access_token, expires_in, ...rest } = await auth_response.json()
        log( `New token: `, new_access_token, ' unexpected output: ', rest )

        // If no access token, error
        if( !new_access_token ) throw new Error( JSON.stringify( rest ) )

        // Set new token to firestore cache
        await db.collection( 'secrets' ).doc( 'poap-api' ).set( {
            access_token: new_access_token,
            expires: Date.now() +  expires_in * 1000 ,
            updated: Date.now()
        }, { merge: true } )

        return new_access_token
    } catch ( e ) {
        log( 'Error getting access token: ', e )
        const text = await backup_res.text().catch( e => e.message )
        log( 'API text response: ', text )
        return null
    }

}


// Health helper
exports.live_access_token = async f => {

    const token = await getAccessToken()
    return !!token

}

/**
* Authenticated API call in JSON format
* @param {string} endpoint Endpoint to call, e.g. /events
* @param {(string|Object)} data Data to send in the request body
* @param {string} [method=GET] - HTTP verb to call with
* @param {string} [format=json] - format to send the body in
* @returns {Object} response API response as documented at https://api.poap.xyz/documentation/static/index.html#/ and https://github.com/poap-xyz/poap-server/blob/development/src/apps/events/routes.ts#L57
* @returns {string} response.error Error message if one is given
* @returns {string} response.message Contains error details if this was an error
*/
exports.call_poap_endpoint = async ( endpoint='', data, method='GET', format='json' ) => {

    /* ///////////////////////////////
		// Validations */
    const has_non_get_data =  method != 'GET' && data 
    const has_get_data = method == 'GET' && data
    const has_non_json_data = data && typeof data != 'object'
    if( has_non_json_data ) throw new Error( `API data must be formatted as json` )

    /* ///////////////////////////////
    // Generate API url */
    // let apiUrl = dev ? 'https://dev-api.poap.tech' : 'https://api.poap.tech' // The new tokens we use are all for the live api
    let apiUrl = 'https://v2fg569j7f.execute-api.us-east-2.amazonaws.com/prod'
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
			
        // authorization for cloudflare */
        'X-API-Key': `${ POAP_API_KEY }`,

        // Authorize with Bearer access token
        Authorization: `Bearer ${ access_token }`,

        // If this is a request with json data
        ... has_non_get_data && format == 'json' && { "Content-Type": "application/json" } 

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
    log( `Calling ${ url } with `, { method, ...request_data } )
    const res = await fetch( url, options )
    const backup_res = res.clone()

    // Parse the response
    try {

        // Try to access response as json first
        const json = await res.json()
        log( 'API json response: ', json )
        return json

    } catch {

        // If json fails, try as text
        const text = await backup_res.text().catch( e => e.message )
        log( 'API text response: ', text )
        return {
            error: `Error calling ${ apiUrl }`,
            message: text
        }

    }


}
