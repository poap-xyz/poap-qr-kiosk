const { log } = require( './helpers' )

/* ///////////////////////////////
// Appcheck validation */
exports.validateCallerDevice = ( data, context ) => {

	if( context.app == undefined ) return false
	
	return true

}

/* ///////////////////////////////
// reCaptcha v2 validation */
const fetch = require( 'isomorphic-fetch' )
const { db } = require( './firebase' )
const functions = require( 'firebase-functions' )
const { recaptcha } = functions.config()
exports.validateCallerCaptcha = async ( captcha_response, context ) => {

	try {

		/* ///////////////////////////////
		// Validate user resonse with recaptcha */
		const recaptcha_endpoint = `https://www.google.com/recaptcha/api/siteverify`
		const options = {
			method: 'POST',
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: `secret=${ recaptcha.secret }&response=${ captcha_response }`
		}
		log( 'Checking captcha with', options )
		const { success, ...response } = await fetch( recaptcha_endpoint, options ).then( res => res.json() )

		// On fail, return false
		if( !success ) throw new Error( `Captcha errors: ${ response[ 'error-codes' ]?.join( ', ' ) }` )

		// On success, cache response so we have longer that the captcha 2 mins validity
		const five_mins_in_ms = 1000 * 60 * 5
		await db.collection( `recaptcha` ).doc( captcha_response ).set( {
			valid: true,
			updated: Date.now(),
			updated_human: new Date().toString(),
			expires: Date.now() + five_mins_in_ms
		} )
		return true


	} catch( e ) {
		log( 'Captach validation error: ', e )
		return false
	}

}