// Sendgrid email module
const functions = require( 'firebase-functions' )
const { sendgrid } = functions.config()
let configured_email_module = undefined
const get_configured_mail_instance = () => {
    if( configured_email_module ) return configured_email_module
    const mail = require( '@sendgrid/mail' )
    mail.setApiKey( sendgrid.apikey )
    configured_email_module = mail
    return configured_email_module
}

async function compilePugToEmail( pugFile, event ) {

    // Function dependencies
    const pug = require( 'pug' )
    const { promises: fs } = require( 'fs' )
    const csso = require( 'csso' )
    const juice = require( 'juice' )

    const [ emailPug, inlineNormalise, styleExtra, styleOutlook, poapStyles ] = await Promise.all( [
        fs.readFile( pugFile ),
        fs.readFile( `${ __dirname }/../templates/css-resets/normalize.css`, 'utf8' ),
        fs.readFile( `${ __dirname }/../templates/css-resets/extra.css`, 'utf8' ),
        fs.readFile( `${ __dirname }/../templates/css-resets/outlook.css`, 'utf8' ),
        fs.readFile( `${ __dirname }/../templates/poap.css`, 'utf8' )
    ] )

    const { css } = csso.minify( [ styleExtra, styleOutlook, inlineNormalise, poapStyles ].join( '\n' ) )
    const html = pug.render( emailPug, { event, headStyles: css } )
    const emailifiedHtml = juice.inlineContent( html, [ inlineNormalise, poapStyles ].join( '\n' ), { removeStyleTags: false } )

    return emailifiedHtml

}


exports.sendEventAdminEmail = async ( { email, event } ) => {

    // Function dependencies
    const { promises: fs } = require( 'fs' )

    try {

        // API auth
        get_configured_mail_instance().setApiKey( sendgrid.apikey )

        // Build email
        const msg = {
            to: email,
            from: sendgrid.fromemail,
            subject: `POAP - Your QR kiosk for ${ event.name }`,
            text: ( await fs.readFile( `${ __dirname }/../templates/kiosk-created.email.txt`, 'utf8' ) ).replace( '%%eventlink%%', event.eventlink ).replace( '%%adminlink%%', event.adminlink ).replace( '%%eventname%%', event.name ),
            html: await compilePugToEmail( `${ __dirname }/../templates/kiosk-created.email.pug`, event ),
        }

        await get_configured_mail_instance().send( msg )

    } catch ( e ) {

        console.error( e )

    }

}

exports.sendCustomClaimEmail = async ( { email, event, claim_code, html } ) => {

    // Function dependencies
    const { log } = require( './helpers' )

    try {

        // Substitute event properties in the HTML
        const event_keys = Object.keys( event )
        let substituted_html = event_keys.reduce( ( html_progress, event_key ) => {

            const key_search = new RegExp( `%%${ event_key }%%`, 'ig' )
            return html_progress.replace( key_search, event[ event_key ] )

        }, html )

        // Substitute claim code in html
        substituted_html = substituted_html.replace( /%%claim_code%%/ig, claim_code )

        // Build email
        const msg = {
            to: email,
            from: sendgrid.fromemail,
            subject: `Claim your POAP for ${ event.name }`,
            html: substituted_html
        }

        log( `Sending custom email: `, substituted_html )
        await get_configured_mail_instance().send( msg )

    } catch ( e ) {

        console.error( e )

    }

}