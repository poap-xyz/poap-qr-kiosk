const functions = require("firebase-functions")
const fs = require( 'fs' ).promises

// Firebase interactors
const { initializeApp } = require("firebase-admin/app")
const { getFirestore, setDoc, doc } = require( 'firebase-admin/firestore' )
const app = initializeApp()
const db = getFirestore( app )

// ///////////////////////////////
// This is a dirty MVP function
// it is only called from the CLI
// by the dev
// ///////////////////////////////
exports.loadCodes = functions.https.onRequest( async ( req, res ) => {

	// This is a manual toggle to disable the function once import is done
	// yes reader, I will buy you a beer so you will forgive me
	return

	// Load codes
	const codesString = await fs.readFile( `./modules/codes.csv`, 'utf8' )
	const codes = codesString.split( '\n' )
	console.log( 'Loading ', codes.length )

	// Write the docs the actions async
	await Promise.all( codes.map( code => {

		return db.collection( 'codes' ).doc( code ).set( {
			used: false,
			created: Date.now(),
			updated: Date.now()
		} )

	} ) )

} )