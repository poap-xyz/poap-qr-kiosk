// Impport dev and log helpers
const { log } = require( '../modules/helpers' )
const debug = false

/**
 * Return a V1 oncall with runtimes. NOTE: v1 appcheck is enforced through code and not config
 * @param {Array.<"X MiB/GiB"|"long_timeout"|"keep_warm">} [runtimes] - Array of runtime keys to use
 * @param {Function} handler - Function to run
 * @returns {Function} - Firebase function 
*/
exports.v1_oncall = ( runtimes=[], handler ) => {

    if( debug ) log( `Creating handler with: `, typeof runtimes, runtimes, typeof handler, handler )

    const functions = require( "firebase-functions" )
    const { v1_runtimes, validate_runtime_settings } = require( './runtimes_settings' )

    // If the first parameter was a function, return the undecorated handler
    if( typeof runtimes === 'function' ) {
        if( debug ) log( 'v1_oncall: no runtimes specified, returning undecorated handler' )
        return functions.https.onCall( runtimes )
    }

    // Validate runtime settings
    validate_runtime_settings( runtimes, v1_runtimes )

    // Config the runtimes for this function
    const runtime = runtimes.reduce( ( acc, runtime_key ) => ( { ...acc, ...v1_runtimes[ runtime_key ] } ), {} )
    if( debug ) log( 'v1_oncall: returning decorated handler with runtime: ', runtime )
    return functions.runWith( runtime ).https.onCall( handler )
}

/**
 * Return a V2 oncall with runtimes
 * @param {Array.<"long_timeout"|"X MiB/GiB"|"keep_warm"|"max_concurrency">} [runtimes] - Array of runtime keys to use, the protected runtime is ALWAYS ADDED
 * @param {Function} handler - Firebase function handler
 * @returns {Function} - Firebase function
 */
exports.v2_oncall = ( runtimes=[], handler ) => {

    if( debug ) log( `Creating handler with: `, typeof runtimes, runtimes, typeof handler, handler )

    const { onCall } = require( "firebase-functions/v2/https" )
    const { v2_runtimes, validate_runtime_settings } = require( './runtimes_settings' )

    // If the first parameter was a function, return the handler as 'protected' firebase oncall
    if( typeof runtimes === 'function' ) {
        if( debug ) log( 'v2_oncall: no runtimes specified, returning undecorated handler' )
        return onCall( { ...v2_runtimes.protected }, runtimes )
    }

    // Validate runtime settings
    validate_runtime_settings( runtimes, v2_runtimes )

    const runtime = runtimes.reduce( ( acc, runtime_key ) => ( { ...acc, ...v2_runtimes[ runtime_key ] } ), { ...v2_runtimes.protected } )
    if( debug ) log( 'v2_oncall: returning decorated handler with runtime: ', runtime )
    return onCall( runtime, handler )
}