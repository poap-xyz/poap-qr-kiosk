// Firebase functionality
import { initializeApp } from "firebase/app"
import { getFirestore, collection, setDoc, doc, onSnapshot, query, where, limit } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"
import { getFunctions, httpsCallable } from 'firebase/functions'

import { log } from './helpers'

// ///////////////////////////////
// Initialisation
// ///////////////////////////////

// Firebase config
const { REACT_APP_apiKey, REACT_APP_authDomain, REACT_APP_projectId, REACT_APP_storageBucket, REACT_APP_messagingSenderId, REACT_APP_appId, REACT_APP_measurementId } = process.env
const config = {
	apiKey: REACT_APP_apiKey,
	authDomain: REACT_APP_authDomain,
	projectId: REACT_APP_projectId,
	storageBucket: REACT_APP_storageBucket,
	messagingSenderId: REACT_APP_messagingSenderId,
	appId: REACT_APP_appId,
	measurementId: REACT_APP_measurementId
}

log( 'Init firebase with ', config )

// Init app
const app = initializeApp( config )
const analytics = getAnalytics( app )
const db = getFirestore( app )
const functions = getFunctions( app )
const importCodes = httpsCallable( functions, 'importCodes' )

// ///////////////////////////////
// Actions
// ///////////////////////////////
export async function markCodeClaimed( code ) {

	// Create the reference to the doc
	const docToSet = doc( db, 'codes', code )

	// Write the code to the doc with the code as ID
	return setDoc( docToSet, { claimed: 'unknown', updated: Date.now() }, { merge: true } )

}

export async function listenToCode( cb ) {

	const col = collection( db, 'codes' )
	const q = query( col, where( 'claimed', '==', false ), limit( 1 ) )
	return onSnapshot( q, snap => {

		const { docs } = snap

		// expext max one doc
		const [ doc ] = docs
		if( !doc ) {
			log( 'No code found in ', snap )
			return cb( {} )
		}
		return cb( { id: doc.id,  ...doc.data() } )

	} )

}

export async function importCodesFromArray( password='', codes=[] ) {

	const { data: { error, success  }} = await importCodes( ( {
		password: password,
		codes: codes
	} ) )

	if( success ) return log( 'Import success with ', success )

	if( error ) throw new Error( error )


}