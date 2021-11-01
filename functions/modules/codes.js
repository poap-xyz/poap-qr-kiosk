// Firebase interactors
const functions = require( 'firebase-functions' )
const { db, dataFromSnap } = require( './firebase' )

// Secrets
const { api } = functions.config()

// Libraries
const fetch = require( 'isomorphic-fetch' )
const Throttle = require( 'promise-parallel-throttle' )

// ///////////////////////////////
// Code helpers
// ///////////////////////////////

// Remote api checker, this ALWAYS resolves
// this is because I am not suer that this API will not suddenly be throttled or authenticated.
const checkCodeStatus = code => fetch( `https://api.poap.xyz/actions/claim-qr?qr_hash=${ code }` ).then( res => res.json() ).catch( e => {

	// Log for my reference
	console.log( 'API error, if this keeps happening check in with the backend team: ', e )

	// Return object so the updateCodeStatus function can continue
	return {
		claimed: 'unknown'
	}
} )

// Code updater
async function updateCodeStatus( code ) {

	// Check claim status on claim backend
	const { claimed, error, message } = await checkCodeStatus( code )

	const updates = {
		updated: Date.now()
	}

	if( error ) updates.error = `${ error }: ${ message }`
	else updates.claimed = claimed ? true : false

	// Set updated status to firestore
	return db.collection( 'codes' ).doc( code ).set( updates, { merge: true } )

}

// ///////////////////////////////
// Code importer
// ///////////////////////////////
exports.importCodes = async ( data, context ) => {

	try {

		// Validate request
		const { password, codes } = data
		if( password !== api.password ) throw new Error( `Incorrect password` )

		// Load the codes into firestore
		await Promise.all( codes.map( code => {

			// If it is a newline, let it go
			if( !code.length ) return

			// Remove web prefixes
			code = code.replace( /(https?:\/\/.*\/)/ig, '')

			if( !code.match( /\w{1,42}/ ) ) throw new Error( `Invalid code: ${ code }` )

			return db.collection( 'codes' ).doc( code ).set( {
				claimed: 'unknown',
				created: Date.now(),
				updated: Date.now()
			} )

		} ) )

		return {
			success: `${ codes.length } imported`
		}

	} catch( e ) {

		console.log( 'importCodes error: ', e )
		return {
			error: `Import error: ${ e.message || e }`
		}

	}

}

// ///////////////////////////////
// Check status of newly unknowns
// ///////////////////////////////
exports.verifyCodeStatusIfUnknownStatus = async ( change, context ) => {

	try {

		// Deletion? Ignore
		if( !change.after.exists ) return

		// Get new data
		const data = change.after.data()

		// Code is untouched by frontend
		if( data.claimed !== 'unknown' ) return
		if( data.error ) return

		// Get code hash through param
		const { code } = context.params

		await updateCodeStatus( code )

	} catch( e ) {

		// Log errors to cloud logs
		console.error( 'verifyCodeStatus error: ', e )

	}

}

// ///////////////////////////////
// Check status of old unknowns
// ///////////////////////////////
exports.refreshOldUnknownCodes = async context => {

	// How old is old?
	const ageInHours = 12
	const ageInMins = ageInHours * 60
	const ageInMs = 1000 * 60 * ageInMins
	const maxInProgress = 10


	try {

		// Get old unknown codes
		const oldUnknowns = await db.collection( 'codes' ).where( 'claimed', '==', 'unknown' ).where( 'updated', '<', Date.now() - ageInMs ).get().then( dataFromSnap )

		// Build action queue
		const queue = oldUnknowns.map( ( { uid } ) => function() {

			return updateCodeStatus( uid )

		} )

		// For every unknown, check the status against live API
		await Throttle.all( queue, {
			maxInProgress: maxInProgress
		} )


	} catch( e ) {
		console.error( 'refreshOldUnknownCodes cron error ', e )
	}

}