const { db, dataFromSnap } = require('./firebase')
const { call_poap_endpoint } = require( './poap_api' )
const app = require( './express' )()
const { generate_new_event_public_auth, validate_and_write_event_codes } = require( './events' )
const { log } = require( './helpers' )
const { v4: uuidv4 } = require('uuid')

// Configs
const functions = require( 'firebase-functions' )
const { kiosk } = functions.config()

app.post( '/generate/:event_id/', async ( req, res ) => {

	try {

		// Add a week grace period in case we need to debug anything
		const weekInMs = 1000 * 60 * 60 * 24 * 7

		// Get request data
		const { event_id } = req.params
		const { secret_code, email } = req.body
		const { CI } = req.query
		log( `Creating kiosk for event ${ event_id } with secret code: ${ secret_code } for ${ email }` )

		// Global config
		const redirect_baseurl = CI ? `http://localhost:3000/` : kiosk.public_url

		// Validations

		// If data is missing, the email client probably does not support POST forms yet
		if( !event_id || !secret_code || !email ) throw new Error( `Your email client does not support generating QR kiosks. Please create one manually at qr.poap.xyz.` )

		// Formulate redirect basis
		let redirect_link = `${ redirect_baseurl }/#/event/`


		// Check if this kiosk exists in the db
		log( `Finding event where event_id is ${ event_id } and secret_code is ${ secret_code }` )
		const [ existing_kiosk ] = await db.collection( 'events' ).where( 'event_id', '==', event_id ).where( 'secret_code', '==', secret_code ).get().then( dataFromSnap )
		log( `Existing kiosk: `, existing_kiosk )
		if( existing_kiosk ) redirect_link += existing_kiosk.uid
		
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

			// Returns [ { qrhash: String, claimed: Boolean } ]
			const codes = await call_poap_endpoint( `/event/${ event_id }/qr-codes`, { secret_code }, 'POST' )
			log( `Received codes: `, codes )
			if( codes.error ) {
				log( `Problem with codes: `, codes )
				throw new Error( `Error in POAP codes API: ${ codes.error }. This is probably not your fault.` )
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
				game_config: {},
				challenges: [],
				expires: new Date( expiry_date ).getTime() + weekInMs,
				expires_yyyy_mm_dd: expiry_date,
				public_auth: generate_new_event_public_auth(),
				created: Date.now(),
				updated: Date.now(),
				updated_human: new Date().toString()
			} )

			// Write the codes to firestore
			await validate_and_write_event_codes( new_kiosk.id, expiry_date, codes )

			// Format redirect link
			redirect_link += new_kiosk.id

		}
		
		
		// Send redirect request to browser
		log( `Sending redirect to: `, redirect_link )
		return res.redirect( 307, redirect_link )

	} catch( e ) {

		console.error( `Kiosk generation error: `, e )
		return res.send( `An error ocurred. ${ e.message }` )

	}

} )

module.exports = app