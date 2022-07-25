// Firebase functionality
import { initializeApp } from "firebase/app"
import { getFirestore, collection, setDoc, doc, onSnapshot, query, where, limit, orderBy } from "firebase/firestore"
import { getAnalytics, logEvent } from "firebase/analytics"
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
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
if( process.env.NODE_ENV === 'development' || REACT_APP_APPCHECK_DEBUG_TOKEN ) self.FIREBASE_APPCHECK_DEBUG_TOKEN = REACT_APP_APPCHECK_DEBUG_TOKEN || true
log( 'Initialising app check with ', REACT_APP_APPCHECK_DEBUG_TOKEN )
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
export const validateCallerCaptcha = httpsCallable( functions, 'validateCallerCaptcha' )
export const refreshScannedCodesStatuses = httpsCallable( functions, 'refreshScannedCodesStatuses' )
export const getEventDataFromCode = httpsCallable( functions, 'getEventDataFromCode' )
export const check_code_status = httpsCallable( functions, 'check_code_status' )
export const get_code_by_challenge = httpsCallable( functions, 'get_code_by_challenge' )
export const health_check = httpsCallable( functions, 'health_check' )
export const claim_code_by_email = httpsCallable( functions, 'claim_code_by_email' )
export const export_emails_of_static_drop = httpsCallable( functions, 'export_emails_of_static_drop' )
export const create_static_drop = httpsCallable( functions, 'create_static_drop' )

// Offline functions emulator
// Connect to functions emulator
if( process.env.REACT_APP_useEmulator ) {
	connectFunctionsEmulator( functions, 'localhost', 5001 )
	log( `Using firebase functions emulator` )
}

// ///////////////////////////////
// Code actions
// ///////////////////////////////


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
export function listenToEventMeta( eventId, cb ) {

	const d = doc( db, 'publicEventData', eventId )

	return onSnapshot( d, snap => {

		const data = snap.data()
		log( `Retreived event metadata: `, data )
		cb( data )

	} )

}

export function listen_to_claim_challenge( challenge_id, cb ) {

	const d = doc( db, 'claim_challenges', challenge_id )

	return onSnapshot( d, snap => {

		const data = snap.data()
		log( `Retreived claim challenge: `, data )
		cb( data )

	} )

}

/**
* Listen to a firestore document path
* @param {String} collection - The name of the collection
* @param {String} document - The path of the document within the given collection
* @param {Function} callback - The callback that receives the changed value of the document
* @returns {Function} Unsubscribe listener 
*/
export function listen_to_document( collection, document, callback ) {

	const d = doc( db, collection, document )

	return onSnapshot( d, snap => {

		const data = snap.data()
		log( `Retreived document ${collection}/${document}: `, data )
		callback( data )

	} )

}

// ///////////////////////////////
// Analytics actions
// ///////////////////////////////
export function trackEvent( name ) {
	if( !name ) return
	if( process.env.NODE_ENV == 'development' ) return log( 'Dummy analytics event: ', name )
	logEvent( analytics, name )
}