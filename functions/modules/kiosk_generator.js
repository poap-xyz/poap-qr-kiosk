const app = require( './express' )()

/**
* Generate a new kiosk through a POST request (or return an existing one)
* @param {object} req - request object
* @param {string} req.params.event_id - Url parameter of the event id /generate/:event_id/
* @param {string} req.body.secret_code - The secret edit code of the event aka drop
* @param {string} req.body.email - The email address of the event organiser
* @param {string} req.query.CI - Make the redirect baseurl into localhost for testing
* @returns 301 redirect 
*/
app.post( '/generate/:event_id', async ( req, res ) => {

    // Function dependencies
    const { db, dataFromSnap, arrayUnion, increment } = require( './firebase' )
    const { call_poap_endpoint } = require( './poap_api' )
    const { generate_new_event_public_auth, validate_and_write_event_codes, get_event_template_by_code } = require( './events' )
    const { log } = require( './helpers' )
    const { v4: uuidv4 } = require( 'uuid' )

    // Configs
    const functions = require( 'firebase-functions' )
    const { kiosk } = functions.config()

    try {

        // Add a week grace period in case we need to debug anything
        const weekInMs = 1000 * 60 * 60 * 24 * 7

        // Get request data
        const { event_id } = req.params
        const { secret_code, email, naive } = req.body
        const { CI } = req.query
        log( `Creating kiosk for event ${ event_id } with secret code: ${ secret_code } for ${ email }` )

        // Global config
        const redirect_baseurl = CI ? `http://localhost:3000/` : kiosk.public_url

        // Validations
        // If data is missing, the email client probably does not support POST forms yet
        if( !event_id || !secret_code || !email ) throw new Error( `Your email client does not support generating QR kiosks. Please create one manually at qr.poap.xyz.` )

        // Store the kiosk id for use in url
        let redirect_url = `${ redirect_baseurl }/#/event/admin`
        let kiosk_uid = undefined
        let kiosk_expiry_date = undefined
        let old_codes = []

        /* ///////////////////////////////
		// Step 1: Grab remote codes */

        // Returns [ { qrhash: String, claimed: Boolean } ]
        const codes = await call_poap_endpoint( `/event/${ event_id }/qr-codes`, { secret_code }, 'POST' )
        log( `Received ${ codes.length } codes, exerpt: `, codes[0] )
        if( codes.error ) {
            log( `Problem with codes: `, codes )
            throw new Error( `Error in POAP codes API: ${ codes.error }. This is probably not your fault.` )
        }

        /* ///////////////////////////////
		// Step 2: grab or create event */

        // Check if this kiosk exists in the db
        log( `Finding event where event_id is ${ event_id } and secret_code is ${ secret_code }` )
        const [ existing_kiosk ] = await db.collection( 'events' ).where( 'event_id', '==', event_id ).where( 'secret_code', '==', secret_code ).get().then( dataFromSnap )
        log( `Existing kiosk: `, existing_kiosk )

        if( existing_kiosk ) {

            // Grab the existing codes
            old_codes = await db.collection( 'codes' ).where( 'event', '==', existing_kiosk.uid ).get().then( dataFromSnap )
            old_codes = old_codes.map( ( { uid, claimed } ) => ( { qr_hash: uid, claimed } ) )
            log( `Grabbed ${ old_codes.length } old codes for event ${ existing_kiosk.uid }` )

            // Set globals for later use
            redirect_url += `/${ existing_kiosk.uid }/${ existing_kiosk.authToken }`
            kiosk_uid = existing_kiosk.uid
            kiosk_expiry_date = existing_kiosk.expires

        }
		
        // If no kiosk exists, create a new entry
        if( !existing_kiosk ) {

            // Get drop metadata
            const drop_data = await call_poap_endpoint( `/events/id/${ event_id }` )
            log( `Drop metadata: `, drop_data )
            const { name, expiry_date, error: drop_error, ...errors } = drop_data
            if( drop_error ) {
                log( `Problem with drop meta request: `, errors )
                throw new Error( `Drop error ${ drop_error }` )
            }

            // Write new kiosk to database
            const authToken = uuidv4()
            const new_kiosk = await db.collection( 'events' ).add( {
                name,
                email,
                event_id,
                secret_code,
                codes: codes.length,
                codesAvailable: codes.length,
                authToken,
                template: await get_event_template_by_code( codes[0] ),
                game_config: {},
                challenges: [],
                naive,
                expires: new Date( expiry_date ).getTime() + weekInMs,
                expires_yyyy_mm_dd: expiry_date,
                public_auth: generate_new_event_public_auth(),
                created: Date.now(),
                updated: Date.now(),
                updated_human: new Date().toString()
            } )

            // Format redirect link
            redirect_url += `/${ new_kiosk.id }/${ authToken }`
            kiosk_uid = new_kiosk.id
            kiosk_expiry_date = expiry_date

            // Keep track of event admin emails
            log( `Updating data for ${ email } to include ${ new_kiosk.id } in the owned events list` )
            await db.collection( 'user_data' ).doc( email ).set( {
                events: arrayUnion( new_kiosk.id ),
                events_organised: increment( 1 ),
                updated: Date.now(),
                updated_human: new Date().toString()
            }, { merge: true } )

        }
		
        /* ///////////////////////////////
		// Step 3: write/update codes of event */
        // Write the codes to firestore
        await validate_and_write_event_codes( kiosk_uid, kiosk_expiry_date, codes, old_codes )

		
        // Send redirect request to browser
        log( `Sending redirect to: `, redirect_url )
        return res.redirect( 307, redirect_url )

    } catch ( e ) {

        console.error( `Kiosk generation error: `, e )
        return res.send( `An error ocurred. ${ e.message }` )

    }

} )

module.exports = app