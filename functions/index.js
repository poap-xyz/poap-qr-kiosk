const functions = require("firebase-functions")
const fs = require( 'fs' ).promises
const fetch = require( 'isomorphic-fetch' )

// Firebase interactors
const { initializeApp } = require("firebase-admin/app")
const { getFirestore, setDoc, doc } = require( 'firebase-admin/firestore' )
const app = initializeApp()
const db = getFirestore( app )

// Secrets
const { api } = functions.config()

// ///////////////////////////////
// Check status against live env
// ///////////////////////////////
exports.verifyCodeStatus = functions.firestore.document( 'codes/{code}' ).onWrite( async ( change, context ) => {

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

		// Check claim status on laim backend
		const { claimed, error, message } = await fetch( `https://api.poap.xyz/actions/claim-qr?qr_hash=${ code }` ).then( res => res.json() )

		const updates = {
			updated: Date.now()
		}

		if( error ) updates.error = `${ error }: ${ message }`
		else updates.claimed = claimed ? true : false

		// Set updated status to firestore
		await db.collection( 'codes' ).doc( code ).set( updates, { merge: true } )

	} catch( e ) {

		// Log errors to cloud logs
		console.error( 'verifyCodeStatus error: ', e )

	}

} )

// ///////////////////////////////
// Load codes submitted in frontend
// ///////////////////////////////
exports.importCodes = functions.https.onCall( async ( data, context ) => {

	try {

		// Validate request
		const { password, codes } = data
		if( password !== api.password ) throw new Error( `Incorrect password` )

		// Load the codes into firestore
		await Promise.all( codes.map( code => {

			// Remove prefixes
			code = code.replace( 'https://poap.xyz/claim/', '' )
			code = code.replace( 'http://poap.xyz/claim/', '' )

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

} )

// ///////////////////////////////
// This is a dirty MVP function
// it is only called from the CLI
// by the dev
// ///////////////////////////////
// exports.loadCodes = functions.https.onRequest( async ( req, res ) => {

// 	// This is a manual toggle to disable the function once import is done
// 	// yes reader, I will buy you a beer so you will forgive me
// 	return

// 	// Load codes
// 	const codesString = await fs.readFile( `./modules/codes.csv`, 'utf8' )
// 	const codes = codesString.split( '\n' )
// 	console.log( 'Loading ', codes.length )

// 	// Write the docs the actions async
// 	await Promise.all( codes.map( code => {

// 		return db.collection( 'codes' ).doc( code ).set( {
// 			claimed: false,
// 			created: Date.now(),
// 			updated: Date.now()
// 		} )

// 	} ) )

// } )