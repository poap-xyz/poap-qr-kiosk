// Function to reduce an array of memory declarations to an object of memory declarations
const reduce_memory_declarations = ( acc, memory ) => ( { ...acc, [ `memory_${ memory }` ]: { memory } } )

/**
 * See https://firebase.google.com/docs/reference/functions/firebase-functions.runtimeoptions
 * @typedef {Object} V1runtimes
 * @property {string} high_memory - Allocate high memory to function
 * @property {string} long_timeout - Set long timeout to function
 * @property {string} keep_warm - Keep function warm
 */
exports.v1_runtimes = {
    // As per https://firebase.google.com/docs/reference/functions/firebase-functions.md#valid_memory_options
    ...[ "128MB", "256MB", "512MB", "1GB", "2GB", "4GB", "8GB" ].reduce( reduce_memory_declarations, {} ),
    long_timeout: { timeoutSeconds: 540 },
    keep_warm: { minInstances: 1 },
}

/**
 * See https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.globaloptions
 * @typedef {Object} V2runtimes
 * @property {string} protected - Enforce appcheck
 * @property {string} long_timeout - Set long timeout to function
 * @property {string} high_memory - Allocate high memory to function
 * @property {string} keep_warm - Keep function warm with min instances
 * @property {string} max_concurrency - Set max concurrency
 */
exports.v2_runtimes = {
    protected: { enforceAppCheck: true },
    long_timeout: { timeoutSeconds: 540 },
    // As per https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.md#memoryoption
    ...[ "128MiB", "256MiB", "512MiB", "1GiB", "2GiB", "4GiB", "8GiB", "16GiB", "32GiB" ].reduce( reduce_memory_declarations, {} ),
    keep_warm: { minInstances: 1 },
    max_concurrency: { concurrency: 1000 }
}

/**
 * 
 * @param {Array} runtimes - runtime object as applied to a function
 * @param {Object} allowed_runtimes - allowed runtime object as defined in this file
 * @param {boolean} throw_on_fail - throw an error if validation fails
 * @returns {boolean} - true if validation passes, false if validation fails and throw_on_fail is false
 */
exports.validate_runtime_settings = ( runtimes, allowed_runtimes, throw_on_fail=true ) => {

    // const { log } = require( '../modules/helpers' )
    // log( `Validating runtime settings against allowed rintimes: `, runtimes, allowed_runtimes )

    // Check that all runtime keys exist in the v2_runtimes object
    const runtime_keys = Object.keys( allowed_runtimes )
    const invalid_runtime_keys = runtimes.filter( runtime_key => !runtime_keys.includes( runtime_key ) )
    if( invalid_runtime_keys.length ) {
        console.error( `Invalid runtime keys: `, invalid_runtime_keys )
        if( throw_on_fail ) throw new Error( `Invalid runtime keys: ${ invalid_runtime_keys.length }` )
        else return false
    }

    return true

}