const { db, dataFromSnap } = require( './firebase' )
const app = require( './express' )()

// Configs
const functions = require( 'firebase-functions' )
const { kiosk } = functions.config()

app.get( '/claim/:code/:eventId?', async ( req, res ) => {

	try {

		// Get the code from the url
		const { code, eventId } = req.params
		if( !code ) throw new Error( `No code in request` )

		// Mark this code as unknown status, but mark true for testing environment
		await db.collection( 'codes' ).doc( code ).set( {
			updated: Date.now(),
			scanned: true,
			claimed: code.includes( 'testing' ) ? true : 'unknown'
		}, { merge: true } )

		// If this is a streaming-mode request, grab a code from the bottom ot the queue instead
		if( eventId ) {

			// Grab code in the reverse orderBy from frontend/src/modules/firebase.js
			const [ oldestCode ] = await db.collection( 'codes' )
															.where( 'event', '==', eventId )
															.where( 'claimed', '==', false )
															.orderBy( 'updated', 'desc' )
															.limit( 1 ).get().then( dataFromSnap )

			// Mark oldest code as unknown status
			await db.collection( 'codes' ).doc( oldestCode.uid ).set( {
				updated: Date.now(),
				scanned: true,
				claimed: code.includes( 'testing' ) ? true : 'unknown'
			}, { merge: true } )

			// Return a forward URL for the new code
			return res.redirect( 307, `${ kiosk.public_url }/#/claim/${ oldestCode.uid }` )

		}

		// Return a redirect to the POAP app
		// 307: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_redirection
		return res.redirect( 307, `${ kiosk.public_url }/#/claim/${ code }` )

	} catch( e ) {

		console.error( '/claim/:code error', e )
		return res.send( `Error validating your code` )

	}

} )

module.exports = app
