// Firebase functionality
import { initializeApp } from "firebase/app"
import { getFirestore, collection, setDoc, doc, onSnapshot, query, where, limit, orderBy } from "firebase/firestore"
import { getAnalytics, logEvent } from "firebase/analytics"
import { getFunctions, httpsCallable } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

import { log, dev } from './helpers'

// ///////////////////////////////
// Initialisation
// ///////////////////////////////

// Firebase config
const { REACT_APP_apiKey, REACT_APP_authDomain, REACT_APP_projectId, REACT_APP_storageBucket, REACT_APP_messagingSenderId, REACT_APP_appId, REACT_APP_measurementId, REACT_APP_recaptcha_site_key, REACT_APP_APPCHECK_DEBUG_TOKEN } = process.env
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

// Init app components
const app = initializeApp( config )
const analytics = getAnalytics( app )
const db = getFirestore( app )
const functions = getFunctions( app )

// App check config
if( dev ) self.FIREBASE_APPCHECK_DEBUG_TOKEN = REACT_APP_APPCHECK_DEBUG_TOKEN
const appcheck = initializeAppCheck( app, {
	provider: new ReCaptchaV3Provider( REACT_APP_recaptcha_site_key ),
	isTokenAutoRefreshEnabled: true
} )

// Remote functions
const importCodes = httpsCallable( functions, 'importCodes' )
export const registerEvent = httpsCallable( functions, 'registerEvent' )
export const deleteEvent = httpsCallable( functions, 'deleteEvent' )
export const checkIfCodeHasBeenClaimed = httpsCallable( functions, 'checkIfCodeHasBeenClaimed' )
export const requestManualCodeRefresh = httpsCallable( functions, 'requestManualCodeRefresh' )
export const validateCallerDevice = httpsCallable( functions, 'validateCallerDevice' )
export const refreshScannedCodesStatuses = httpsCallable( functions, 'refreshScannedCodesStatuses' )

// ///////////////////////////////
// Code actions
// ///////////////////////////////
// export async function markCodeClaimed( code ) {

// 	// Create the reference to the doc
// 	const docToSet = doc( db, 'codes', code )

// 	// Write the code to the doc with the code as ID
// 	return setDoc( docToSet, { claimed: 'unknown', updated: Date.now() }, { merge: true } )

// }

export async function listenToCode( eventId, cb ) {

	// Grab oldest known code that has not been claimed
	const col = collection( db, 'codes' )
	const q = query( col, where( 'event', '==', eventId ), where( 'claimed', '==', false ), orderBy( "updated" ), limit( 1 ) )
	return onSnapshot( q, snap => {

		const { docs } = snap

		// expext max one doc
		const [ doc ] = docs
		if( !doc ) {
			log( 'No code found in ', snap )
			return cb( {} )
		}

		// Give new code to frontend
		const newCode = { id: doc.id,  ...doc.data() }
		log( 'New code received: ', newCode )
		cb( newCode )

		// Tell backend to double check the code status in case it is expired
		return newCode.id ? checkIfCodeHasBeenClaimed( newCode.id ) : true

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

/* ///////////////////////////////
// Event actions
// /////////////////////////////*/
export async function listenToEventMeta( eventId, cb ) {

	const d = doc( db, 'publicEventData', eventId )

	return onSnapshot( d, snap => {

		const data = snap.data()
		log( `Retreived event metadata: `, data )
		cb( data )

	} )

}

// ///////////////////////////////
// Analytics actions
// ///////////////////////////////
export function event( name ) {
	if( !name ) return
	if( process.env.NODE_ENV == 'development' ) return log( 'Dummy analytics event: ', name )
	logEvent( analytics, name )
}