// Firebase functionality
import { initializeApp } from "firebase/app"
import { getFirestore, doc, onSnapshot, connectFirestoreEmulator } from "firebase/firestore"
import { getAnalytics, logEvent } from "firebase/analytics"
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

import { log } from './helpers'

// ///////////////////////////////
// Initialisation
// ///////////////////////////////

// Firebase config
const { VITE_apiKey, VITE_authDomain, VITE_projectId, VITE_storageBucket, VITE_messagingSenderId, VITE_appId, VITE_measurementId, VITE_recaptcha_site_key, VITE_APPCHECK_DEBUG_TOKEN } = import.meta.env
const config = {
    apiKey: VITE_apiKey,
    authDomain: VITE_authDomain,
    projectId: VITE_projectId,
    storageBucket: VITE_storageBucket,
    messagingSenderId: VITE_messagingSenderId,
    appId: VITE_appId,
    measurementId: VITE_measurementId
}

log( 'Init firebase with ', config )

// Init app components
const app = initializeApp( config )
const analytics = getAnalytics( app )
const db = getFirestore( app )
const functions = getFunctions( app )

// App check config
if( VITE_APPCHECK_DEBUG_TOKEN ) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = VITE_APPCHECK_DEBUG_TOKEN || true
    log( 'Initialising app check with ', VITE_APPCHECK_DEBUG_TOKEN )
}
initializeAppCheck( app, {
    provider: new ReCaptchaV3Provider( VITE_recaptcha_site_key ),
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
export const remote_ping = httpsCallable( functions, 'ping' )
export const claim_code_by_email = httpsCallable( functions, 'claim_code_by_email' )
export const export_emails_of_static_drop = httpsCallable( functions, 'export_emails_of_static_drop' )
export const delete_emails_of_static_drop = httpsCallable( functions, 'delete_emails_of_static_drop' )
export const create_static_drop = httpsCallable( functions, 'create_static_drop' )
export const log_kiosk_open = httpsCallable( functions, 'log_kiosk_open' )
export const mint_code_to_address = httpsCallable( functions, 'mint_code_to_address' )
export const recalculate_available_codes = httpsCallable( functions, 'recalculate_available_codes' )

// Offline emulators
const functions_emulator_port = 5001
const firestore_emulator_port = 8080
const emulator_host = 'localhost' // Note that cypress sometimes can't resolve localhost causing net::ERR_EMPTY_RESPONSE failures
if( import.meta.env.VITE_useEmulator ) {
    log( `🤖 EMULATOR MODE ENABLED` )
    connectFunctionsEmulator( functions, emulator_host, functions_emulator_port )
    log( `Using firebase functions emulator on port ${ functions_emulator_port }` )
    connectFirestoreEmulator( db, emulator_host, firestore_emulator_port )
    log( `Using firebase firestore emulator on port ${ firestore_emulator_port }` )
}

export const get_emulator_function_call_url = name => `http://localhost:${ functions_emulator_port }/${ VITE_projectId }/us-central1/${ name }`

// ///////////////////////////////
// Code actions
// ///////////////////////////////


export async function importCodesFromArray( password='', codes=[] ) {

    const { data: { error, success  } } = await importCodes(  {
        password: password,
        codes: codes
    }  )

    if( success ) return log( 'Import success with ', success )

    if( error ) throw new Error( error )


}

/* ///////////////////////////////
// Event actions
// /////////////////////////////*/
export function listenToEventMeta( eventId, cb ) {

    if( !eventId ) {
        log( `No event id specified to listener` )
        return
    }
	
    log( `Creating event metadata listener for :`, eventId )
    const d = doc( db, 'publicEventData', `${ eventId }` )

    return onSnapshot( d, snap => {

        const data = snap.data()
        log( `Retrieved event metadata: `, data )
        if( cb ) cb( data )
        else console.error( `Missing callback` )

    } )

}

export function listen_to_claim_challenge( challenge_id, cb ) {

    if( !challenge_id ) {
        log( `No challenge id specified to listener` )
        return
    }
    const d = doc( db, 'claim_challenges', challenge_id )

    return onSnapshot( d, snap => {

        const data = snap.data()
        log( `Retrieved claim challenge: `, data )
        if( cb ) cb( data )
        else console.error( `Missing callback` )

    } )

}

/**
* Listen to a firestore document path
* @param {String} collection - The name of the collection
* @param {String} document - The path of the document within the given collection
* @param {Function} callback - The callback that receives the changed value of the document
* @returns {Function} Unsubscribe listener 
*/
export function listen_to_document( collection, document, cb ) {

    const d = doc( db, collection, document )

    return onSnapshot( d, snap => {

        const data = snap.data()
        log( `Retrieved document ${ collection }/${ document }: `, data )
        if( cb ) cb( data )
        else console.error( `Missing callback` )

    } )

}

// ///////////////////////////////
// Analytics actions
// ///////////////////////////////
export function trackEvent( name ) {
    if( !name ) return
    if( import.meta.env.NODE_ENV == 'development' ) return log( 'Dummy analytics event: ', name )
    logEvent( analytics, name )
}