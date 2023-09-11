// Firebase interactors
const { db, dataFromSnap, increment, deleteField } = require( './firebase' )
const { log, isEmail, isWalletOrENS, isWallet } = require( './helpers' )
const { throw_on_failed_app_check } = require( './security' )


// ///////////////////////////////
// Code helpers
// ///////////////////////////////

// Remote api checker, this ALWAYS resolves
// this is because I am not sure that this API will not suddenly be throttled or authenticated.
const checkCodeStatus = async code => {

    // Testing data for CI
    const tomorrow = new Date( Date.now() + 1000 * 60 * 60 * 24 )
    const dayMonthYear = `${ tomorrow.getDate() }-${ tomorrow.toString().match( /(?:\w* )([A-Z]{1}[a-z]{2})/ )[1] }-${ tomorrow.getFullYear() }`
	
    // For testing codes, always reset on refresh
    if( code.includes( 'testing' ) ) {

        // Get cached CI claim data
        const [ claimed_code ] = await db.collection( `static_drop_claims` ).where( 'claim_code', '==', code ).get().then( dataFromSnap )
        log( `Code claim match: `, claimed_code )
        return {
            claimed: !!claimed_code,
            secret: `mock_secret`,
            event: { 
                id: `mock-event`,
                end_date: dayMonthYear, 
                expiry_date: dayMonthYear, 
                name: `Test Event ${ Math.random() }`
            }
        }

    }

    // Get API data
    const { call_poap_endpoint } = require( './poap_api' )
    return call_poap_endpoint( `/actions/claim-qr`, { qr_hash: code } )

}

// Publically exposed code check
exports.check_code_status = function( code, context ) {

    throw_on_failed_app_check( context )
    return checkCodeStatus( code )

}

// Code claiming function
async function claim_code_to_address( claim_code, drop_id, address, claim_secret, send_default_email=true ) {

    // Function dependencies
    const { call_poap_endpoint } = require( './poap_api' )

    log( `Claiming ${ claim_code } to ${ address } with ${ send_default_email ? 'default' : 'custom' } email` )

    // Handle mock claiming
    const is_mock_claim = `${ drop_id }`.includes( `mock` )

    // Claim remotely, return empty mock response for mock claims
    const claim_result = is_mock_claim ?  {  }  : await call_poap_endpoint( `/actions/claim-qr`, { address, qr_hash: claim_code, secret: claim_secret, sendEmail: send_default_email }, 'POST', 'json' )

    // API error handling
    const { error, message, Message, statusCode } = claim_result
    if(	error ) throw new Error( `${ error }: ${ message || Message || statusCode || 'unknown details' }` )

    // If it succeeded, save in local firestore
    const one_hour = 1000 * 60 * 60
    const claim_meta = { updated: Date.now(), updated_human: new Date().toString(), is_mock_claim, ... is_mock_claim && { expires: Date.now() + one_hour }  }
    await db.collection( `static_drop_claims` ).add( { address, drop_id, claim_code, claim_secret, ...claim_meta } )

    // If all went well, return 
    return

}

// Code updater
async function updateCodeStatus( code, cachedResponse ) {

    if( !code ) return

    // Check claim status on claim backend
    let { claimed, error, message, Message } = cachedResponse || await checkCodeStatus( code )

    // The api is unpredictable with error/message keys, the message should only ever happen inthe case of an error
    let readableError = ''
    if( !error && message ) readableError = message
    if( !error && Message ) readableError = Message
    if( error ) readableError = `${ error } - ${ message || Message }`

    // Formulate updates
    const updates = { updated: Date.now() }

    // If there was an error, append it to the code
    if( error || message || Message ) {
        updates.error = readableError
    } else { 

        // If no error then set the claimed status and update counter
        updates.claimed = !!claimed

        // Track how many times this code has been updated from the api
        updates.amountOfRemoteStatusChecks = increment( 1 )
        updates.lastRemoteStatusCheck = Date.now()

    }
    // Track error frequency
    if( error ) {

        // Track by code
        await db.collection( 'erroredCodes' ).doc( code ).set( {
            updated: Date.now(),
            error: error,
            strikes: increment( 1 )
        }, { merge: true } )

        // Track by error
        await db.collection( 'errors' ).doc( error ).set( {
            updated: Date.now(),
            strikes: increment( 1 ),
            message: message || ''
        }, { merge: true } ).catch( e => {
            // This might happen if the remote error code has weird characters
            console.error( 'Unable to write error ', e )
        } )

    }

    // Set updated status to firestore
    await db.collection( 'codes' ).doc( code ).set( updates, { merge: true } )

    // Return the status for use in other places
    return updates.claimed

}

/* ///////////////////////////////
// Get event data from code
// /////////////////////////////*/
exports.getEventDataFromCode = async function ( code, context ) {

    try {

        throw_on_failed_app_check( context )

        // Get code meta from API
        const { event, error, message } = await checkCodeStatus( code )

        // Return only the event portion
        return { event, error: error && `${ error }, ${ message }` }


    } catch ( e ) {
        console.error( 'getEventDataFromCode error: ', e )
        return { error: e.message }
    }

}



// ///////////////////////////////
// Check status of old unknowns
// ///////////////////////////////
exports.refresh_unknown_and_unscanned_codes = async ( event_id, context ) => {

    // If this was called with context (cron) use delay check
    // if there was no context (frontend asked) then run with no delay
    // const ageInMins = source == 'cron' ? 5 : 0

    // These are some sane defaults to prevent complete DOSsing
    const ageInSeconds = 5 * 60
    const ageInMs = 1000 * ageInSeconds
    const errorSlowdownFactor = 10
    const maxInProgress = 500
    const debounce_ms = 1000 * 60


    try {

        // Appcheck validation
        throw_on_failed_app_check( context )

        // Input validation
        if( !event_id ) throw new Error( `Event ID was not passed to refresh` )

        /* ///////////////////////////////
        // Debounce this function */
        const { started } = await db.collection( 'meta' ).doc( `event_refresh_debounce_${ event_id }` ).get().then( dataFromSnap )

        // If there is a running refresh, and it is within the debounce window, exit
        if( started && started < Date.now() - debounce_ms ) return log( `Refresh already running for ${ event_id }` )

        // Set this run as the running one
        await db.collection( 'meta' ).doc( `event_refresh_debounce_${ event_id }` ).set( { started: Date.now(), started_human: new Date().toString() }, { merge: true } )

        // Get old unknown codes
        const oldUnknowns = await db.collection( 'codes' )
            .where( 'claimed', '==', 'unknown' )
            .where( 'updated', '<', Date.now() - ageInMs )
            .where( 'event', '==', event_id )
            .get().then( dataFromSnap )

        // Get unchecked codes
        const uncheckedCodes = await db.collection( 'codes' )
            .where( 'amountOfRemoteStatusChecks', '==', 0 )
            .where( 'event', '==', event_id )
            .get().then( dataFromSnap )

        // Split codes with previous errors
        const [ clean, withErrors ] = oldUnknowns.reduce( ( acc, val ) => {

            const [ cleanAcc, errorAcc ] = acc
            if( val.error ) return [ cleanAcc, [ ...errorAcc, val ] ]
            else return [ [ ...cleanAcc, val ], errorAcc ]

        }, [ [], [] ] )

        // Make the error checking slower
        const olderWithErrors = withErrors.filter( ( { updated } ) => updated <  Date.now() -  ageInMs * errorSlowdownFactor   )

        // Build action queue
        const old_unknown_queue = [ ...uncheckedCodes, ...clean, ...olderWithErrors ].map( ( { uid } ) => function() {

            return updateCodeStatus( uid )

        } )

        // Throttle dependency
        const Throttle = require( 'promise-parallel-throttle' )

        // Check old unknowns against the live API
        await Throttle.all( old_unknown_queue, {
            maxInProgress: maxInProgress
        } )

        // Build action queue
        const unscanned_queue = [ ...uncheckedCodes ].map( ( { uid } ) => function() {

            return updateCodeStatus( uid )

        } )

        // Check unscanned against live qpi
        const unscanned_statusses = await Throttle.all( unscanned_queue, {
            maxInProgress: maxInProgress
        } )

        // Update public event counter
        const codes_already_claimed = unscanned_statusses.reduce( ( acc, val ) => {
            if( val == true ) return acc + 1
            return acc
        }, 0 )

        // Increment event database
        await db.collection( 'events' ).doc( event_id ).set( { codesAvailable: increment( -codes_already_claimed ), updated: Date.now(), updated_by: 'refresh_unknown_and_unscanned_codes' }, { merge: true } )

        // Mark this run as finished
        await db.collection( 'meta' ).doc( `event_refresh_debounce_${ event_id }` ).set( { started: deleteField(), started_human: deleteField(), ended: Date.now(), ended_human: new Date().toString() }, { merge: true } )

        return 'success'


    } catch ( e ) {
        console.error( 'refreshOldUnknownCodes cron error ', e )
        return e
    }

}

// ///////////////////////////////
// Check status of scanned codes
// ///////////////////////////////
exports.refreshScannedCodesStatuses = async ( eventId, context ) => {

    // const oneHour = 1000 * 60 * 60
    const checkCodesAtLeast = 2
    const checkCooldown = 1000 * 30
    const maxInProgress = 10
    const debounce_ms = 1000 * 60


    try {

        // Appcheck validation
        throw_on_failed_app_check( context )

        if( !eventId ) throw new Error( `Code refresh called without event ID` )

        /* ///////////////////////////////
        // Debounce this function */
        const { started } = await db.collection( 'meta' ).doc( `scanned_codes_debounce_${ eventId }` ).get().then( dataFromSnap )

        // If there is a running refresh, and it is within the debounce window, exit
        if( started && started < Date.now() - debounce_ms ) return log( `Refresh already running for ${ eventId }` )

        // Set this run as the running one
        await db.collection( 'meta' ).doc( `scanned_codes_debounce_${ eventId }` ).set( { started: Date.now(), started_human: new Date().toString() }, { merge: true } )

        // Get event data
        const event = await db.collection( 'events' ).doc( eventId ).get().then( dataFromSnap )

        // Set the code reset timeout to the length of the anti-farming game plus 10 seconds buffer
        const codeResetTimeout =  1000 * 10  + ( event?.game_config?.duration ||  1000 * 60  )


        // Codes that have been scanned and have not been claimed
        const scannedAndUnclaimedCodes = await db.collection( 'codes' )
            .where( 'event', '==', eventId )
            .where( 'scanned', '==', true )
            .where( 'claimed', '==', false )
            .get().then( dataFromSnap )

        // Grab codes that have been checked and are old enough
        const codesToReset = scannedAndUnclaimedCodes.filter( ( { amountOfRemoteStatusChecks, lastRemoteStatusCheck, } ) => amountOfRemoteStatusChecks > checkCodesAtLeast && lastRemoteStatusCheck <  Date.now() - codeResetTimeout  )
        await Promise.all( codesToReset.map( ( { uid } ) => db.collection( 'codes' ).doc( uid ).set( {
            scanned: false,
            amountOfRemoteStatusChecks: 0
        }, { merge: true } ) ) )

        // Filter out codes that were checked within the throttle interval. This may be useful if there are 50 ipads at an event and they all trigger rechecks.
        const codesToCheck = scannedAndUnclaimedCodes.filter( ( { updated } ) => updated <  Date.now() - checkCooldown  )

        // Build action queue
        const queue = codesToCheck.map( ( { uid } ) => () => updateCodeStatus( uid ) )

        // For every unknown, check the status against live API
        const Throttle = require( 'promise-parallel-throttle' )
        await Throttle.all( queue, {
            maxInProgress: maxInProgress
        } )

        // Delete debounce doc
        await db.collection( 'meta' ).doc( `scanned_codes_debounce_${ eventId }` ).set( { started: deleteField(), started_human: deleteField(), end: Date.now(), end_human: new Date().toString() }, { merge: true } )

        return { updated: codesToCheck.length, reset: codesToReset.length }


    } catch ( e ) {
        console.error( 'refreshOldUnknownCodes cron error ', e )
        return { error: e.message }
    }

}

/* ///////////////////////////////
// Public event data updater
// /////////////////////////////*/

exports.updateEventAvailableCodes = async function( change, context ) {

    const { before, after } = change

    // Exit on deletion or creation
    if( !after.exists || !before.exists ) return

    const { codeId } = context.params
    const { claimed: prevClaimed } = before.data() || {}
    const { event, claimed, amountOfRemoteStatusChecks } = after.data()

    // Do nothing if no change
    if( prevClaimed === claimed ) return

    // If this is the first update, do not increment the public event data
    // this is being done manually in refresh_unknown_and_unscanned_codes
    if( amountOfRemoteStatusChecks <= 1 ) return

    // Scenarios:
    // false > unknown = -1
    // false > true = -1
    // unknown > true = 0
    // true > false = +1
    // unknown > false = +1

    // If code was unclaimed, and it is now claimed or possibly claimed (unknown status), increment the counter up
    if( prevClaimed === false && [ 'unknown', true ].includes( claimed ) ) {
        return db.collection( 'events' ).doc( event ).set( { codesAvailable: increment( -1 ), updated: Date.now(), updated_by: 'updateEventsAvailableCodes decrement' }, { merge: true } )
    }
	
    // If the code was thought to be (possibly) claimed previously, but we now know it is unclaimed for sure, add an extra code to the event counter
    if( [ true, 'unknown' ].includes( prevClaimed ) && claimed === false ) {
        return db.collection( 'events' ).doc( event ).set( { codesAvailable: increment( 1 ), updated: Date.now(), updated_by: 'updateEventsAvailableCodes increment' }, { merge: true } )
    }	


}

/* ///////////////////////////////
// Get code based on valid challenge
// /////////////////////////////*/
exports.get_code_by_challenge = async ( data, context ) => {

    try {

        const { challenge_code, captcha_response } = data
        log( `Get code for challenge: ${ challenge_code }` )

        // Grace period for completion, this is additional to the window of generate_new_event_public_auth
        let grace_period_in_ms = 1000 * 30

        // Captcha requests get an extra 3 minutes of grace period
        if( captcha_response ) grace_period_in_ms +=  1000 * 60 * 3 

        // Validate caller
        if( !captcha_response && context.app == undefined ) {
            throw new Error( `App context error` )
        }

        // Validate by captcha
        if( captcha_response ) {

            log( `Validating captcha: ${ captcha_response }` )
            const { valid, expires, ...captcha_meta } = await db.collection( 'recaptcha' ).doc( captcha_response ).get().then( dataFromSnap )

            // Invalid failure modes
            log( `Captcha data: `, valid, expires, captcha_meta )
            if( !valid ) throw new Error( `Invalid recaptcha` )
            if( expires < Date.now() ) throw new Error( `Expired recaptcha` )


        }

        /* ///////////////////////////////
		// Validate the challenge */

        // Get challenge
        const challenge = await db.collection( 'claim_challenges' ).doc( challenge_code ).get().then( dataFromSnap )
		
        // Check if challenge still exists
        if( !challenge || !challenge.eventId ) throw new Error( `This link was already used by somebody else, scan the QR code again please` )

        // Check if challenge expired already
        const now_minus_grace_period = Date.now() - grace_period_in_ms
        if( challenge.expires < now_minus_grace_period ) {
            log( `Challenge expired at ${ challenge.expires } which is ${ ( now_minus_grace_period - challenge.expires ) / 1000 } seconds ago` )
            throw new Error( `This link expired, please make sure to claim your POAP right after scanning the QR.` )
        }

        /* ///////////////////////////////
		// Get a verified available code */
        let valid_code = undefined
        while( !valid_code ) {

            // Grab oldest available code
            const [ oldestCode ] = await db.collection( 'codes' )
                .where( 'event', '==', challenge.eventId )
                .where( 'claimed', '==', false )
                .orderBy( 'updated', 'asc' )
                .limit( 1 ).get().then( dataFromSnap )

            if( !oldestCode || !oldestCode.uid ) throw new Error( `No more POAPs available for this event!` )

            // Mark oldest code as unknown status so other users don't get it suggested
            log( `Marking code ${ oldestCode.uid } claimed status as ${ oldestCode.uid.includes( 'testing' ) ? true : 'unknown' }: `, oldestCode )
            await db.collection( 'codes' ).doc( oldestCode.uid ).set( {
                updated: Date.now(),
                scanned: true,
                claimed: oldestCode.uid.includes( 'testing' ) ? true : 'unknown'
            }, { merge: true } )

            // Check whether the code is actually valid
            const code_meta = await checkCodeStatus( oldestCode.uid )

            // If this code is confirmed available, send it to the user
            if( code_meta && !code_meta?.claimed ) valid_code = oldestCode

        }

        // Delete challenge to prevent reuse
        await db.collection( 'claim_challenges' ).doc( challenge_code ).delete()

        // In case of success, remove cached captcha
        if( captcha_response ) await db.collection( 'recaptcha' ).doc( captcha_response ).delete()

        // Return valid code to the frontend
        return valid_code.uid

    } catch ( e ) {

        log( `Error getting code: `, e )
        return { error: e.message }

    }

}

/* ///////////////////////////////
// Claim code by email
// /////////////////////////////*/
exports.claim_code_by_email = async ( data, context ) => {

    try {

        // Validate input
        let { claim_code, email_or_0x_address, is_static_drop } = data
        if(	!isEmail( email_or_0x_address ) && !isWalletOrENS( email_or_0x_address ) ) throw new Error( `Invalid email/wallet format` )
        if( !claim_code ) throw new Error( `Missing event data` )

        // Remove all +hack elements of emails
        if( !isWallet( email_or_0x_address ) ) email_or_0x_address = email_or_0x_address.replace( /(\+.*)(?=@)/ig, '' )

        // Grab private drop meta needed for claim
        const { secret, claimed, event } = await checkCodeStatus( claim_code )
        if( claimed ) throw new Error( `This QR was already used and is no longer valid.` )

        // Determine whether custom email needs to be sent
        const drop_id = `${ event.id }`
        let custom_email = false
        if( is_static_drop ) {
            const { custom_email: stored_custom_email } = await db.collection( 'static_drop_private' ).doc( drop_id ).get().then( dataFromSnap )
            custom_email = stored_custom_email
        }

        // Trigger claim with POAP backend
        await claim_code_to_address( claim_code, drop_id, email_or_0x_address, secret, !custom_email )

        // If custom email was requested, formulate and send it
        if( custom_email && isEmail( email_or_0x_address ) ) {
            log( `Sending custom email to ${ email_or_0x_address }` )
            const { sendCustomClaimEmail } = require( './email' )
            await sendCustomClaimEmail( { email: email_or_0x_address, event, claim_code, html: custom_email } )
        }

        return { success: true }

    } catch ( e ) {
        console.error( `Error claiming code: `, e.message )
        return { error: e.message }
    }

}