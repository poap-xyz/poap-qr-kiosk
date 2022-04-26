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
export const refreshScannedCodesStatuses = httpsCallable( functions, 'refreshScannedCodesStatuses' )
export const getEventDataFromCode = httpsCallable( functions, 'getEventDataFromCode' )
export const get_code_by_challenge = httpsCallable( functions, 'get_code_by_challenge' )
export const health_check = httpsCallable( functions, 'health_check' )

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
export async function listenToEventMeta( eventId, cb ) {

	const d = doc( db, 'publicEventData', eventId )

	return onSnapshot( d, snap => {

		const data = snap.data()
		log( `Retreived event metadata: `, data )
		cb( data )

	} )

}

export async function listen_to_claim_challenge( challenge_id, cb ) {

	const d = doc( db, 'claim_challenges', challenge_id )

	return onSnapshot( d, snap => {

		const data = snap.data()
		log( `Retreived claim challenge: `, data )
		cb( data )

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