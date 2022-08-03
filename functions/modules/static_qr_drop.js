const { db, dataFromSnap } = require("./firebase")
const { log } = require("./helpers")
const { call_poap_endpoint } = require("./poap_api")
const Papa = require( 'papaparse' )
const { validate: validate_uuid } = require( 'uuid' )

exports.export_emails_of_static_drop = async ( data, context ) => {

    try {

        /* ///////////////////////////////
        // Validations */

        // Destructure inputs
        log( `Export called with `, data )
        const { drop_id, secret_code, auth_code } = data
        const is_mock_claim = drop_id?.includes( `mock` )

        // Grab internal drop config
        const drop_config = await db.collection( `static_drop_private` ).doc( drop_id ).get().then( dataFromSnap )
        log( `Received drop config: `, drop_config )

        // Validate config versus inputs
        if( !drop_config?.approved ) throw new Error( `This drop was not aproved` )
        if( drop_config?.auth_code !== auth_code ) throw new Error( `Invalid authentication token` )

        // Validate inputs with POAP api
        const { valid } = await call_poap_endpoint( `/event/validate`, { event_id: drop_id, secret_code }, 'POST', 'json' )
        log( `POAP secret_code valid: `, valid )
        if( !valid ) throw new Error( `Invalid secret code` )

        /* ///////////////////////////////
        // Email export */

        // Grab email signups of this event
        const signups = await db.collection( `static_drop_claims` ).where( 'drop_id', '==', `${ drop_id }` ).get().then( dataFromSnap )

        // Generate csv string
        const csv_string = Papa.unparse( signups )

        // Send csv
        return { csv_string }


    } catch( e ) {
        log( `Error exporting emails: `, e )
        return { error: e.message }
    }

}

exports.create_static_drop = async ( data, context ) => {

    try {

        /* ///////////////////////////////
        // Validations */

        // Destructure inputs
        log( `Create called with `, data )
        const { drop_id, auth_code, optin_text, welcome_text } = data
        const is_mock_claim = drop_id?.includes( `mock` )

        // Validate config versus inputs
        if( `${ drop_id }`.length != 5 ) throw new Error( `Drop ID length is invalid, it should be 6 characters long.` )
        if( !validate_uuid( auth_code ) ) throw new Error( `Auth code is not a valid uuid` )

        // Store drop config
        const drop_config = {
            auth_code,
            ...( optin_text?.length && { optin_text } ),
            ...( welcome_text?.length && { welcome_text } ),
            approved: false,
            updated: Date.now(), updated_human: new Date().toString()
        }
        await db.collection( `static_drop_private` ).doc( drop_id ).set( drop_config, { merge: true } )

        // Send output
        return { success: true, drop_config }


    } catch( e ) {
        log( `Error exporting emails: `, e )
        return { error: e.message }
    }

}