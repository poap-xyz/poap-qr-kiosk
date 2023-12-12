// Firebase interactors
const { v4: uuidv4 } = require( 'uuid' )
const { log, email_pseudo_anonymous } = require( './helpers' )
const { throw_on_failed_app_check } = require( './security' )
const { mock_event } = require( './mock_data' )

// Configs
const { KIOSK_PUBLIC_URL } = process.env

// Public auth helper, used here and in the claimcode handler
const generate_new_event_public_auth = ( expires_in_minutes=2, is_test_event=false ) => ( {
    token: is_test_event ? `testing-${ uuidv4() }` : uuidv4(),
    expires: Date.now() +  expires_in_minutes * 1000 * 60 ,
    expiry_interval: expires_in_minutes,
    created: Date.now()
} )
exports.generate_new_event_public_auth = generate_new_event_public_auth

/**
* Helper that sanitises codes and writes them to the database, but errors if there is a clash
* @param {string} event_id The id of the event that these codes belong to
* @param {number} expiration_date Timestamp of the expiration date of the event
* @param {{qr_hash: String, claimed: Boolean}[]} codes An array of codes to sanitise, validate and save to the firestore
* @param {{qr_hash: String, claimed: Boolean}[]} existing_codes An array of codes to expect to already exist
* @returns {Promise<array>} codes An array of the codes written to the database
* @throws {Error} error Throws if anything failed
*/
async function validate_and_write_event_codes( event_id, expiration_date, codes, existing_codes=[] ) {

    // Function dependencies
    const Throttle = require( 'promise-parallel-throttle' )
    const { db, dataFromSnap } = require( './firebase' )

    log( `Writing ${ codes?.length } (of which ${ existing_codes?.length } old) for event ${ event_id } (expired ${ expiration_date })` )

    // Add a week grace period in case we need to debug anything
    const weekInMs = 1000 * 60 * 60 * 24 * 7

    // Throttle config
    const maxInProgress = 500


    /* ///////////////////////////////
	// Step 1: validations and clash handling */
	
    // Sanetise codes
    const saneCodes = codes.map( code => {

        let { qr_hash } = code
        const { claimed } = code

        if( !qr_hash ) throw new Error( `Malformed code input` )

        // Remove web prefixes
        qr_hash = qr_hash.replace( /(https?:\/\/.*\/)/ig, '' )

        // Make sure hash matches wallet hash length
        if( !qr_hash.match( /\w{1,42}/ ) ) throw new Error( `Invalid code: ${ qr_hash }` )

        return { qr_hash, claimed }

    } ).filter( ( { qr_hash } ) => !!qr_hash.length )

    // Parse out codes that are expected to be new, so keep only codes that are not found in the existing_code array
    const new_codes = saneCodes.filter( ( { qr_hash } ) => !existing_codes?.find( existing_code => existing_code.qr_hash == qr_hash ) )

    // First check if all codes are unused by another event
    const code_clash_queue = new_codes.map( code => async () => {

        // Check if code already exists and is claimed
        const oldDocRef = await db.collection( 'codes' ).doc( code.qr_hash ).get()
        const oldDocData = oldDocRef.data()
        if( !oldDocRef.exists ) return
        const { email } = await db.collection( 'events' ).doc( event_id ).get().then( dataFromSnap )
        if( oldDocData.event != event_id ) throw new Error( `Error: This POAP Kiosk has already been created by ${ email_pseudo_anonymous( email ) }!\n\nThis means you (or someone on your team) already uploaded these mint link and received an email with the subject "POAP - Your QR Kiosk".\n\nPlease find that email to view or delete your Kiosk.\n\n\n--------\nYou can safely ignore this: \nDebug data for POAP programmers: duplicate entry is ${ JSON.stringify( code ) }` )

    } )

    // Check for code clashes in a throttled manner
    await Throttle.all( code_clash_queue, { maxInProgress } )

    /* ///////////////////////////////
	// Step 2: Throttled code writing using firestore patches */
	
    // Batch config
    const batch_size = 499

    // Split into chunks of batch_size
    const code_chunks = []
    for( let index = 0; index < saneCodes.length; index += batch_size ) {
        const chunk = saneCodes.slice( index, index + batch_size )
        code_chunks.push( chunk )
    }

    // Create batches for each chunk
    const code_batches = code_chunks.map( chunk => {
            
        // Make a batch for this chunk
        const batch = db.batch()

        // For each entry in the chunk, add a batch set
        chunk.forEach( code => {

            if( !code ) return

            const ref = db.collection( `codes` ).doc( code.qr_hash )
            batch.set( ref, {
                claimed: !!code.claimed,
                scanned: false,
                amountOfRemoteStatusChecks: 0,
                created: Date.now(),
                updated: Date.now(),
                updated_human: new Date().toString(),
                event: event_id,
                expires: new Date( expiration_date ).getTime() + weekInMs
            }, { merge: true } )

        } )

        // Return batch
        return batch
            
    } )

    // Create writing queue
    const writing_queue = code_batches.map( batch => () => batch.commit() )

    // Write the watches with retry
    const { throttle_and_retry } = require( './helpers' )
    await throttle_and_retry( writing_queue, maxInProgress, `validate_and_write_event_codes`, 2, 5 )

    // Old non-batchified way
    // // Load the codes into firestore
    // const code_writing_queue = saneCodes.map( code => async () => {

    //     return db.collection( 'codes' ).doc( code.qr_hash ).set( {
    //         claimed: !!code.claimed,
    //         scanned: false,
    //         amountOfRemoteStatusChecks: 0,
    //         created: Date.now(),
    //         updated: Date.now(),
    //         updated_human: new Date().toString(),
    //         event: event_id,
    //         expires: new Date( expiration_date ).getTime() + weekInMs
    //     }, { merge: true } )

    // } )

    // // Write codes to firestore with a throttle
    // await Throttle.all( code_writing_queue, { maxInProgress } )

    // Return the sanitised codes
    return saneCodes

}
exports.validate_and_write_event_codes = validate_and_write_event_codes

/**
* Get the event template by event ID
* @param {string} an_event_qr_hash - One of the codes belonging to the event
* @returns {object} template_data - empty object if none, details if exists: https://documentation.poap.tech/reference/getevent-templates-3 
*/
async function get_event_template_by_code( an_event_qr_hash ) {

    try {

        // 🤡 If this is a mock code, return empty
        if( an_event_qr_hash.includes( 'testing'  ) ) return {}

        // Function dependencies
        const { call_poap_endpoint } = require( './poap_api' )

        // Get event ID as known within the POAP system
        const { event } = await call_poap_endpoint( `/actions/claim-qr`, { qr_hash: an_event_qr_hash } )
        const { event_template_id } = event

        // If no template data, return empty
        if( !event_template_id ) return {}

        // Grab template data
        const template_data = await call_poap_endpoint( `/event-templates/${ event_template_id }` )
        log( `Template id ${ event_template_id } is called ${ template_data.name }` )

        return template_data

    } catch ( e ) {

        log( `get_event_template_if_exists error: `, e )
        return {}

    }

}
exports.get_event_template_by_code = get_event_template_by_code

/**
* * Update the kiosk name, description, and image using POAP API backing data
* @param {String} kiosk_id The id of the kiosk to update, also referred to sometimes as the eventId, but does NOT mean drop id
* @param {Object} [public_kiosk_data] The public kiosk data if available, we use the .event property to calculate the debounce window
* @returns {Promise<boolean>} specifies whether update was applied
*/
const update_event_data_of_kiosk = async ( kiosk_id, public_kiosk_data ) => {

    // Configs
    const max_age_of_event_data_in_ms = 1000 * 60 * 5

    try {

        // Function dependencies
        const { db, dataFromSnap } = require( './firebase' )
        const { call_poap_endpoint } = require( './poap_api' )

        log( `Updating event data of kiosk ${ kiosk_id }` )

        // If we did not get public kiosk data, retreive it
        if( !public_kiosk_data ) public_kiosk_data = await db.collection( 'publicEventData' ).doc( kiosk_id ).get().then( dataFromSnap )

        // Check if the event data was updated recently
        const event_last_updated = public_kiosk_data?.event?.updated || 0
        const age_of_event_data = Date.now() - event_last_updated
        if( age_of_event_data < max_age_of_event_data_in_ms ) {
            log( `Event is only ${ age_of_event_data / 1000 }s old, not updating` )
            return false
        }

        // Get the most recent event data based on the drop id
        let { dropId, is_mock } = public_kiosk_data
        let event = {}

        // 🤡 Get the most recent event data based on the drop id, or mock if needed
        if( dropId ) event = is_mock ? mock_event() : await call_poap_endpoint( `/events/id/${ dropId }` )
        
        // If we have no drop id, then this is a legacy format event and we cannot get data based on the eventid, instead we need to get it based on the codes
        if( !dropId ) {
            
            // Get a single code of this event
            const [ code ] = await db.collection( 'codes' ).where( 'event', '==', kiosk_id ).limit( 1 ).get().then( dataFromSnap )
            log( `Using code ${ code?.uid } to get event data` )

            // 🤡 Check if this is a mock code
            const is_mock_code = code?.uid.includes( 'testing' )

            // Get event data based on the code
            const { event: event_of_code } = is_mock_code ? { event: mock_event() } : await call_poap_endpoint( `/actions/claim-qr`, { qr_hash: code?.uid } )

            // Set the event of the code to the event
            event = event_of_code

        }

        log( `Updating kiosk ${ kiosk_id } event data: `, event )

        // Update the event data
        await db.collection( 'publicEventData' ).doc( kiosk_id ).set( { event }, { merge: true } )

        return true

    } catch ( e ) {

        log( `update_event_data_of_kiosk error: `, e )
        return false

    }

}

exports.update_event_data_of_kiosk = update_event_data_of_kiosk

exports.registerEvent = async request => {

    let new_event_id = undefined
    const { data } = request

    try {

        // Function dependencies
        const { db, arrayUnion, increment } = require( './firebase' )

        // Add a week grace period in case we need to debug anything
        const weekInMs = 1000 * 60 * 60 * 24 * 7

        // Validations
        const { name='', email='', date='', dropId, codes=[], challenges=[], game_config={ duration: 30, target_score: 5 }, css, collect_emails=false, claim_base_url } = data
        if( !codes.length ) throw new Error( 'Csv has 0 entries' )
        if( !name.length ) throw new Error( 'Please specify an event name' )
        if( !email.includes( '@' ) ) throw new Error( 'Please specify a valid email address' )
        if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( 'Please specify the date in YYYY-MM-DD, for example 2021-11-25' )

        // Get the ip this request came from
        const { get_ip_from_request } = require( './firebase' )
        const created_from_ip = get_ip_from_request( request ) || 'unknown'

        // Create event document
        const authToken = uuidv4()
        // 🤡 Check if this is a mock event
        const is_mock = !!codes.find( code => code.includes( 'testing' ) )
        const public_auth_expiry_interval_minutes = is_mock ? .5 : 2
        const event_data = {
            dropId,
            name,
            email,
            expires: new Date( date ).getTime() + weekInMs, // Event expiration plus a week
            expires_yyyy_mm_dd: date,
            codes: codes.length,
            codesAvailable: 0, // This will be updated by the initial scan run in codes.js:updateEventAvailableCodes
            authToken,
            challenges,
            game_config,
            is_mock,
            ... css && { css } ,
            collect_emails,
            ... claim_base_url && { claim_base_url },
            template: await get_event_template_by_code( codes[0] ),
            public_auth: generate_new_event_public_auth( public_auth_expiry_interval_minutes, is_mock ),
            created: Date.now(),
            updated: Date.now(),
            updated_by: 'registerEvent',
            created_from_ip
        }
        log( `Creating event: `, event_data )
        const { id } = await db.collection( 'events' ).add( event_data )
        new_event_id = id

        // Format codes to the helpers understand the format
        const formatted_codes = codes.map( qr_hash => ( { qr_hash, claimed: 'unknown' } ) )

        // Check code validity and write to firestore
        await validate_and_write_event_codes( id, date, formatted_codes )

        // NOTE: this was moved to an onCreate trigger in index.js, leaving this here as a debug breadcrumb in case it did not solve out issue with creating large events
        // NOTE: safe to delete after jan 2024
        // Calculate publicly available codes for this new event
        // const { recalculate_available_codes } = require( './codes' )
        // await recalculate_available_codes( id )

        // Grab the latest drop data form api, adding the event_data is important because the publicEventData does not exist yet
        await update_event_data_of_kiosk( id, event_data )

        // Send email to user with event and admin links
        const { sendEventAdminEmail } = require( './email' )
        await sendEventAdminEmail( {
            email: email,
            event: {
                name,
                eventlink: `${ KIOSK_PUBLIC_URL }/#/event/${ id }`,
                adminlink: `${ KIOSK_PUBLIC_URL }/#/event/admin/${ id }/${ authToken }`
            }
        } )

        // Keep track of event admin emails
        await db.collection( 'user_data' ).doc( email ).set( {
            events: arrayUnion( id ),
            events_organised: increment( 1 ),
            updated: Date.now(),
            updated_human: new Date().toString()
        }, { merge: true } )

        // Return event data
        return {
            id,
            name,
            authToken
        }


    } catch ( e ) {

        console.error( 'createEvent error ', e )

        // If we created an event, delete it and its codes
        if( new_event_id ) {
            const { db } = require( './firebase' )
            await db.collection( 'events' ).doc( new_event_id ).delete().catch( e => log( `Error deleting event data for ${ new_event_id }`, e ) )
            await db.collection( 'codes' ).where( 'event', '==', new_event_id ).get().then( snap => snap.map( doc => doc.ref.delete() ) ).catch( e => log( `Error deleting event data for ${ new_event_id }`, e ) )
        }

        return { error: e.message }

    }


}

exports.updatePublicEventData = async function( change, context ) {

    const { after, before } = change
    const { eventId } = context.params

    // Function dependencies
    const { db } = require( './firebase' )

    // Define which keys should be shown publicly
    const public_keys = [ 'name', 'codes', 'codesAvailable', 'expires', 'public_auth', 'challenges', 'game_config', 'template', 'css', 'collect_emails', 'claim_base_url', 'scans' ]

    // Get the data of the changes
    const after_data = after.data()
    let before_data = before.data()

    // If there was no data after, thai was a deletion and we can stop, indes.js:delete_data_of_deleted_event will handle it
    if( !after_data ) return

    // If there was data before, check if any keys changed
    if( before_data ) {

        // Check if any of the public keys changed between the before and after
        const keys_changed = public_keys.some( key => JSON.stringify( after_data[ key ] ) != JSON.stringify( before_data[ key ] ) )

        // If no keys changed, return
        if( !keys_changed ) return

    }

    // If there was no before data, this is a new event and we should set the before data to an empty object so the below reducer can work
    if( !before_data ) before_data = {}

    
    // Generate an object with the changed keys
    const changed_keys_object = public_keys.reduce( ( acc, key ) => {

        // Get the values of the key in the before and after objects
        const old_value = before_data[ key ]
        const new_value = after_data[ key ]

        // If the key was not in the previous object and it is in the new object, add it
        const { is_valid_firestore_value } = require( './firebase' )
        if( !old_value && is_valid_firestore_value( new_value ) ) acc[ key ] = new_value

        // If the key was in the previous object, but the value changed, update
        // we're using a naive JSON.stringify comparison here, but it's good enough for our purposes
        if( JSON.stringify( old_value ) != JSON.stringify( new_value ) ) acc[ key ] = new_value

        return acc

    } , {} )

    // Set default values for keys that are not explicitly set but need a value
    if( !after_data.collect_emails ) changed_keys_object.collect_emails = false
    if( !after_data.codesAvailable ) changed_keys_object.codesAvailable = 0

    // If this was an update, grab the public properties and set them
    const public_data_object = {
        ...changed_keys_object,
        updated: Date.now(),
        updated_by: 'updatePublicEventData'
    }

    await db.collection( 'publicEventData' ).doc( eventId ).set( public_data_object, { merge: true } )

    // Sync the event data with the POAP central systems if needed
    return update_event_data_of_kiosk( eventId )

}

exports.deleteEvent = async function( data, context ) {
	
    try {

        // Function dependencies
        const { db, dataFromSnap } = require( './firebase' )

        throw_on_failed_app_check( context )

        // Validations
        const { eventId, authToken } = data

        // Check if authorisation is correct
        const { authToken: eventAuthToken } = await db.collection( 'events' ).doc( eventId ).get().then( dataFromSnap )
        if( authToken != eventAuthToken ) throw new Error( `Invalid admin code` )
		
        // If it is correct, delete the event (which triggers the deletion of codes)
        await db.collection( 'events' ).doc( eventId ).delete()

        return {
            deleted: eventId
        }


    } catch ( e ) {

        console.error( 'createEvent error ', e )
        return { error: e.message }

    }


}

exports.delete_data_of_deleted_event = async function( snap, context ) {

    // Function dependencies
    const { throttle_and_retry } = require( './helpers' )
    const { db } = require( './firebase' )

    // Throttle config
    const maxInProgress = 500

    try {

        // Get parameters
        const { eventId } = context.params

        /* ///////////////////////////////
		// Delete obsolete codes & challenges */

        // Grab data belonging to the deleted event
        const { docs: codes_snap } = await db.collection( 'codes' ).where( 'event', '==', eventId ).get()
        const { docs: challenges_snap } = await db.collection( 'claim_challenges' ).where( 'eventId', '==', eventId ).get()
        const { docs: kiosk_scans } = await db.collection( 'scans' ).where( 'event_id', '==', eventId ).get()
        
        // Delete obsolete data
        await db.collection( 'publicEventData' ).doc( eventId ).delete()
        await db.collection( 'kiosk_scans' ).doc( eventId ).delete()

        const deletion_queue = [ ...codes_snap, ...challenges_snap, ...kiosk_scans ].map( doc => () => doc.ref.delete() )
        await throttle_and_retry( deletion_queue, maxInProgress, `delete data of deleted event`, 5, 5 )

    } catch ( e ) {
        console.error( 'deleteCodesOfDeletedEvent error: ', e )
    }

}

exports.getUniqueOrganiserEmails = async function(  ) {

    try {

        if( !process.env.development ) return console.error( 'getUniqueOrganiserEmails called externally which is never allowed' )

        // Function dependencies
        const { db, dataFromSnap } = require( './firebase' )

        const events = await db.collection( 'events' ).get().then( dataFromSnap )
        const emails = events.map( ( { email } ) => email )
        const uniqueEmails = []
        emails.map( email => {
            if( uniqueEmails.includes( email ) ) return
            uniqueEmails.push( email )
        } )
		
        return uniqueEmails

    } catch ( e ) {
        console.error( e )
    }

}
