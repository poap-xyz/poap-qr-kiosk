const { db, dataFromSnap } = require('./firebase')
const { call_poap_endpoint } = require( './poap_api' )
const app = require( './express' )()
const { generate_new_event_public_auth } = require( './events' )

// Configs
const functions = require( 'firebase-functions' )
const { kiosk } = functions.config()

app.get( '/generate/:event_id/', async ( req, res ) => {

	try {

		// Add a week grace period in case we need to debug anything
		const weekInMs = 1000 * 60 * 60 * 24 * 7

		// Get request data
		const { event_id } = req.params
		const { secret_code, email } = req.body
		const { CI } = req.query

		// Global config
		const redirect_baseurl = CI ? `http://localhost:3000/` : kiosk.public_url

		// Validations
		if( !event_id || !secret_code ) throw new Error( `Malformed request` )

		// Formulate redirect basis
		let redirect_link = `${ redirect_baseurl }/#/event/`


		// Check if this kiosk exists in the db
		const existing_kiosk = await db.collection( 'events' ).where( 'event_id', '==', event_id ).where( 'secret_code', '==', secret_code ).get().then( dataFromSnap )
		if( existing_kiosk.uid ) redirect_link += existing_kiosk.uid
		
		// If no kiosk exists, create a new entry
		if( !existing_kiosk.uid ) {

			const drop_data = await call_poap_endpoint( `/event/id/${ event_id }` )
			const { name, expiry_date } = drop_data

			const codes = await db

			const new_kiosk = await db.collection( 'events' ).add( {
				name,
				email,
				codes: codes.length,
				codesAvailable: codes.length,
				challenges: [],
				expires: new Date( expiry_date ).getTime() + weekInMs,
				expires_yyyy_mm_dd: expiry_date,
				public_auth: generate_new_event_public_auth(),
				created: Date.now(),
				updated: Date.now(),
				updated_human: new Date().toString()
			} )

		}
		
		
		// Send redirect request to browser
		return res.redirect( 307, redirect_link )

	} catch( e ) {

		console.error( e )
		return res.send( `Kiosk error` )

	}

} )

module.exports = app