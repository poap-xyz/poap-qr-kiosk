const { db } = require( './firebase' )
const app = require( './express' )()

app.get( '/claim/:code', async ( req, res ) => {

	try {

		// Get the code from the url
		const { code } = req.params
		if( !code ) throw new Error( `No code in request` )

		// Mark this code as unknown status, but mark true for testing environment
		await db.collection( 'codes' ).doc( code ).set( {
			updated: Date.now(),
			scanned: Date.now(),
			claimed: code.includes( 'testing' ) ? true : 'unknown'
		}, { merge: true } )

		// Return a redirect to the POAP app
		// 307: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_redirection
		return res.redirect( 307, `https://poap-qr-kiosk.web.app/#/claim/${ code }` )

	} catch( e ) {

		console.error( '/claim/:code error', e )
		return res.send( `Error validating your code` )

	}

} )

module.exports = app
