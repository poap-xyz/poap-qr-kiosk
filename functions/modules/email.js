const functions = require( 'firebase-functions' )
const { sendgrid } = functions.config()
const mail = require( '@sendgrid/mail' )
const juice = require('juice')

// Email templates
const pug = require('pug')
const { promises: fs } = require( 'fs' )
const csso = require('csso')

async function compilePugToEmail( pugFile, event ) {

	const [ emailPug, inlineNormalise, styleExtra, styleOutlook, poapStyles ]= await Promise.all( [
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

	try {

		// API auth
		mail.setApiKey( sendgrid.apikey )

		// Build email
		const msg = {
			to: email,
			from: sendgrid.fromemail,
			subject: `POAP - Your QR kiosk for ${ event.name }`,
			text: ( await fs.readFile( `${ __dirname }/../templates/kiosk-created.email.txt`, 'utf8' ) ).replace( '%%eventlink%%', event.eventlink ).replace( '%%adminlink%%', event.adminlink ).replace( '%%eventname%%', event.name ),
			html: await compilePugToEmail( `${ __dirname }/../templates/kiosk-created.email.pug`, event ),
		}

		console.log( msg )

		await mail.send( msg )

	} catch( e ) {

		console.error( e )

	}

}