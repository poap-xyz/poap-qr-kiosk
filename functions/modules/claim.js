const { get_code_by_challenge } = require( './codes' )
const { log, dev } = require( './helpers' )

const app = require( './express' )()

// Log this scan for farmer analysis
const log_scan = async ( req, data ) => {

    // Function dependencies
    const { db, increment } = require( './firebase' )
    
    // Create metadata object
    const { generate_metadata_from_request } = require( './security' )

    // This helperfunction expects a firebase request, because this is an express request, we must mock that using the rawRequest property
    let request_metadata = generate_metadata_from_request( { rawRequest: req } )

    // Log this scan for farmer analysis and add it to event for scan metrics
    await Promise.all( [
        db.collection( 'scans' ).add( { ...data, ...request_metadata } ),
        db.collection( 'events' ).doc( data.event_id ).set( { scans: increment( 1 ) }, { merge: true } )
    ] )

}

/**
 * Cycles the public authentication for a specified event.
 * 
 * This function checks if the current public authentication for an event has expired.
 * If it has, it generates a new authentication and updates the event with this new authentication,
 * while preserving the previous authentication data.
 * 
 * @async
 * @function cycle_event_public_auth_if_expired
 * @param {string} event_id - The ID of the event for which public authentication is being cycled.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * 
 * @example
 * // Call the function with an event ID
 * await cycle_event_public_auth_if_expired('event123');
 */
const cycle_event_public_auth_if_expired = async event_id => {

    const { db, dataFromSnap } = require( './firebase' )
    const { generate_new_event_public_auth } = require( './events' )

    const event = await db.collection( 'events' ).doc( event_id ).get().then( dataFromSnap )
    const { previous_public_auth={} } = event || {}

    // If the auth expired, write a new one but only after the current scanner was let through
    const new_auth_expires_in_m = previous_public_auth?.expiry_interval || 2
    if( event.public_auth?.expires < Date.now() ) {

        // Write new public auth AND save previous
        log( `Previous auth expired, writing new auth` )
        await db.collection( 'events' ).doc( event_id ).set( {
            public_auth: generate_new_event_public_auth( new_auth_expires_in_m ),
            previous_public_auth: event?.public_auth || {}
        }, { merge: true } )
    }

}

app.get( '/claim/:event_id/:public_auth_token', async ( req, res ) => {

    // Function dependencies
    const { db, dataFromSnap } = require( './firebase' )
    const { generate_new_event_public_auth } = require( './events' )
    const { KIOSK_PUBLIC_URL } = process.env

    try {


        // Check whether this request came from a CI instance, set the relevant return URL based on that
        const { CI, FORCE_INVALID_APPCHECK } = req.query
        const redirect_baseurl = CI ? `http://localhost:3000` : KIOSK_PUBLIC_URL
        if( dev ) log( `CI: ${ CI }, FORCE_INVALID_APPCHECK: ${ FORCE_INVALID_APPCHECK }, redirect_baseurl: ${ redirect_baseurl }` )

        // Get event id and authentication from request
        const { event_id, public_auth_token } = req.params

        log( `Request for ${ event_id }/${ public_auth_token }` )

        // If missing data, send to robot stall page
        if( !event_id || !public_auth_token ) {
            if( dev ) log( `Missing data, sending to robot stall page` )
            return res.redirect( 307, `${ redirect_baseurl }/#/claim/robot/syntax_error` )
        }

        // Get the event from firestore
        const event = await db.collection( 'events' ).doc( event_id ).get().then( dataFromSnap )
        if( !event.uid ) throw new Error( `Event ${ event_id } does not exist` )

        // If the auth expired, write a new one but only after the current scanner was let through
        await cycle_event_public_auth_if_expired( event_id )

        /* ///////////////////////////////
		// Timing helpers */

        // Get current and previous auth token from firestore event entry
        const { public_auth={}, previous_public_auth={} } = event || {}

        // Check if event was previously marked as being a test event
        const is_test_event = previous_public_auth?.token?.includes( 'testing-' )

        // /////////////////////
        // Grace period config
        // Note: this sets how long scans are valid, it is an ESSENTIAL part of this applicaion
        // CI is set low so we can check if our app is performans
        // Live is set longer so that users on slow networks are not penalised
        const old_auth_grace_period_in_ms = 1000 * (  CI || is_test_event ? 60 : 60 )

        // Check whether the (previous) auth token is still valid
        const current_auth_is_valid = public_auth?.token == public_auth_token
        const previous_auth_is_valid = previous_public_auth?.token == public_auth_token

        // If the newly created code is younger than the grace period, the old code should be considered still valid
        const previous_auth_within_grace_period = public_auth?.created >  Date.now() - old_auth_grace_period_in_ms 

        /* ///////////////////////////////
		// Failure cases */

        // Auth is not new QR or old QR
        const completely_invalid = !current_auth_is_valid && !previous_auth_is_valid

        // Auth is old QR outside of grace period
        const outside_grace_period = previous_auth_is_valid && !previous_auth_within_grace_period

        // If the auth is invalid AND the auth is not the previous auth within the grace period, mark as robot
        if( completely_invalid || outside_grace_period ) {

            let url = `${ redirect_baseurl }/#/claim/robot/${ public_auth_token }_miss_`
            url += completely_invalid ? 'compinv_' : 'ncompinv_'
            url += outside_grace_period ? 'outgr_' : 'noutgr_'
            url += current_auth_is_valid ? 'valpub_' : 'nvalpub_'
            url += previous_auth_is_valid ? 'valprev_' : 'nvalprev_'
            url += previous_auth_within_grace_period ? 'previngr_' : 'nprevingr_'
            if( dev ) {

                // Log timing data
                log( `Grace period for ${ CI ? 'CI' : 'non-CI' }, event ${ is_test_event ? 'is' : 'is not' } mock/test event, old_auth_grace_period_in_ms: ${ old_auth_grace_period_in_ms }` )
                log( `Seconds left in grace period for previous auth: ${ ( old_auth_grace_period_in_ms - ( Date.now() - public_auth?.created ) ) / 1000 }` )

                // log out all condition values
                log( `completely_invalid: ${ completely_invalid }, outside_grace_period: ${ outside_grace_period }, current_auth_is_valid: ${ current_auth_is_valid }, previous_auth_is_valid: ${ previous_auth_is_valid }, previous_auth_within_grace_period: ${ previous_auth_within_grace_period }` )
                log( `Invalid auth, sending to robot stall page with 307 ${ url }` )
            }
            return res.redirect( 307, url )

        }

        /* ///////////////////////////////
		// Success case */

        // Grace period timing default
        let new_challenge_expires_in_mins = 1

        // If game mode was configured, add game length (originally in seconds) to the default duration
        if( event?.game_config?.duration ) new_challenge_expires_in_mins =  new_challenge_expires_in_mins +  event?.game_config?.duration / 60  

        // Write a challenge ID to the cache with an expires setting of the game duration plus a grace period
        const challenge_auth = generate_new_event_public_auth( new_challenge_expires_in_mins, is_test_event )
        await db.collection( 'claim_challenges' ).doc( challenge_auth.token ).set( {
            eventId: event_id,
            ...challenge_auth,
            challenges: event.challenges || [ 'game' ],
            game_config: event.game_config || { duration: 30, target_score: 5 }
        } )

        // Return a redirect to the QR POAP app
        // 307: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_redirection
        let redirect_link = `${ redirect_baseurl }/#/claim/${ challenge_auth.token }`

        // If this is Naive mode overwrite directly to claim page
        if( event.challenges.includes( 'naive' ) ) {

            // Get a POAP if the challenge is valid, this bypasses the frontend device-validations
            const claim_code = await get_code_by_challenge( { challenge_code: challenge_auth.token }, { app: 'override captcha checks, string content irrelevant' } )

            // If there was an error getting the code, redirect to error state
            if( claim_code.error ) throw new Error( `Error getting claim code: ${ claim_code.error }` )

            // Check if this event has a custom base url, if so, set it as the redirect base
            if( event?.claim_base_url ) redirect_link = event.claim_base_url
            else redirect_link = `https://app.poap.xyz/claim/`

            // Add the POAP claim code to the url
            redirect_link += `${ claim_code }`

            // If this request included ?user_address=0x... add it to the redirect link, this is the behaviour of the POAP app
            const { user_address } = req.query || {}
            if( user_address ) redirect_link += `?user_address=${ user_address }`

            // Log this scan for farmer analysis
            await log_scan( req, { event_id, public_auth_token, challenge_auth, redirect_link } )

            // Forward to redirect_link
            log( `Naive mode, redirecting to ${ redirect_link }` )
            return res.redirect( 307, redirect_link )
        }

        // Tell fronted to force invalid appcheck, this is so that we can simulate this scenarion in cypress
        if( FORCE_INVALID_APPCHECK ) redirect_link += `/force_failed_appcheck`

        // Debugging info in the URL
        if( is_test_event || CI ) {

            const new_auth_expires_in_m = previous_public_auth?.expiry_interval || 2
            redirect_link += `?event_expires=${ new_auth_expires_in_m * 60 }s&chal_expires=${ new_challenge_expires_in_mins * 60 }s&grace=${ old_auth_grace_period_in_ms / 1000 }s&trail=`
            redirect_link += completely_invalid ? 'compinv_' : 'ncompinv_'
            redirect_link += outside_grace_period ? 'outgr_' : 'noutgr_'
            redirect_link += current_auth_is_valid ? 'valpub_' : 'nvalpub_'
            redirect_link += previous_auth_is_valid ? 'valprev_' : 'nvalprev_'
            redirect_link += previous_auth_within_grace_period ? 'previngr_' : 'nprevingr_'

            // Log out all condition values
            if( dev ) {
                log( `completely_invalid: ${ completely_invalid }, outside_grace_period: ${ outside_grace_period }, current_auth_is_valid: ${ current_auth_is_valid }, previous_auth_is_valid: ${ previous_auth_is_valid }, previous_auth_within_grace_period: ${ previous_auth_within_grace_period }` )
                log( `Sending to ${ redirect_link }` )
            }
        }
        // If this request included ?user_address=0x... add it to the redirect link, this is the behaviour of the POAP app
        const { user_address } = req.query || {}
        if( user_address ) {
            redirect_link += redirect_link.includes( '?' ) ? '&' : '?'
            redirect_link += `user_address=${ user_address }`
        }

        // Log this scan for farmer analysis
        await log_scan( req, { event_id, public_auth_token, challenge_auth, redirect_link } )

        // Send redurect request to browser
        return res.redirect( 307, redirect_link )

    } catch ( e ) {

        const { event_id, public_auth_token } = req.params || {}
        console.error( `/claim/${ event_id }/${ public_auth_token } error`, e )
        return res.send( `Error validating your QR` )

    }

} )

module.exports = app
