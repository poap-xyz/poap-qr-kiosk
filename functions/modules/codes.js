// Firebase interactors
const functions = require("firebase-functions")
const { db } = require( './firebase' )

// Secrets
const { api } = functions.config()

// Libraries
const fetch = require( 'isomorphic-fetch' )

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

exports.verifyCodeStatus = async ( change, context ) => {

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

}