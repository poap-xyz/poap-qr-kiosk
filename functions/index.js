// V1 Dependencies
const functions = require( "firebase-functions" )

// V2 Dependencies
const { onRequest, onCall } = require( "firebase-functions/v2/https" )

// V2 Runtime config
const protected_runtime = {
    enforceAdmins: true,
}

// V1 Runtime config
const generousRuntime = {
    timeoutSeconds: 540,
    memory: '4GB'
}
const keepWarmRuntime = {
    minInstances: 1,
}
const { log, dev } = require( './modules/helpers' )
log( `⚠️ Verbose mode on, ${ dev ? '⚙️ dev mode on' : '🚀 production mode on' }` )

// ///////////////////////////////
// Code status managers
// ///////////////////////////////

const { refreshScannedCodesStatuses, refresh_unknown_and_unscanned_codes, getEventDataFromCode, check_code_status } = require( './modules/codes' )

// Get event data of a code
exports.getEventDataFromCode = functions.https.onCall( getEventDataFromCode )

// Get all data of a code
exports.check_code_status = functions.https.onCall( check_code_status )

// Refresh all codes ( trigger from frontend )
exports.requestManualCodeRefresh = functions.runWith( generousRuntime ).https.onCall( refresh_unknown_and_unscanned_codes )

// Allow frontend to trigger updates for scanned codes
exports.refreshScannedCodesStatuses = functions.runWith( generousRuntime ).https.onCall( refreshScannedCodesStatuses )

// ///////////////////////////////
// Event data
// ///////////////////////////////

const { registerEvent, deleteEvent, getUniqueOrganiserEmails } = require( './modules/events' )
exports.registerEvent = functions.runWith( generousRuntime ).https.onCall( registerEvent )
exports.deleteEvent = functions.https.onCall( deleteEvent )

// Email export to update event organisers
exports.getUniqueOrganiserEmails = functions.https.onCall( getUniqueOrganiserEmails )

// ///////////////////////////////
// QR Middleware API
// ///////////////////////////////
const claimMiddleware = require( './modules/claim' )
exports.claimMiddleware = onRequest( { cors: true, ...keepWarmRuntime }, claimMiddleware )

/* ///////////////////////////////
// Kiosk generator middleware API
// /////////////////////////////*/
const generate_kiosk = require( './modules/kiosk_generator' )
exports.generate_kiosk = functions.https.onRequest( generate_kiosk )

// ///////////////////////////////
// Housekeeping
// ///////////////////////////////

const { updateEventAvailableCodes } = require( './modules/codes' )
const { delete_data_of_deleted_event, updatePublicEventData } = require( './modules/events' )
const { clean_up_expired_items } = require( './modules/health' )

// Delete items where parents were deleted
exports.clean_up_expired_items = functions.runWith( generousRuntime ).pubsub.schedule( 'every 24 hours' ).onRun( clean_up_expired_items )
exports.delete_data_of_deleted_event = functions.firestore.document( `events/{eventId}` ).onDelete( delete_data_of_deleted_event )

// Update items where parents were updated
exports.updatePublicEventData = functions.firestore.document( `events/{eventId}` ).onWrite( updatePublicEventData )
exports.updateEventAvailableCodes = functions.firestore.document( `codes/{codeId}` ).onUpdate( updateEventAvailableCodes )


/* ///////////////////////////////
// Security
// /////////////////////////////*/
const { validateCallerDevice, validateCallerCaptcha } = require( './modules/security' )
exports.validateCallerDevice = onCall( { ...protected_runtime, ...keepWarmRuntime,  }, validateCallerDevice )
exports.validateCallerCaptcha = functions.https.onCall( validateCallerCaptcha )

/* ///////////////////////////////
// Code claiming
// /////////////////////////////*/
const { get_code_by_challenge } = require( './modules/codes' )
exports.get_code_by_challenge = functions.https.onCall( get_code_by_challenge )

/* ///////////////////////////////
// Health check
// /////////////////////////////*/
const { health_check, public_health_check } = require( './modules/health' )
exports.health_check = functions.https.onCall( health_check )
exports.ping = functions.https.onCall( ping => 'pong' )

/* ///////////////////////////////
// Static QR system
// /////////////////////////////*/
const { claim_code_by_email } = require( './modules/codes' )
const { export_emails_of_static_drop, create_static_drop, update_public_static_drop_data, delete_emails_of_static_drop } = require( './modules/static_qr_drop' )
exports.export_emails_of_static_drop = functions.https.onCall( export_emails_of_static_drop )
exports.delete_emails_of_static_drop = functions.https.onCall( delete_emails_of_static_drop )
exports.claim_code_by_email = functions.https.onCall( claim_code_by_email )
exports.create_static_drop = functions.https.onCall( create_static_drop )
exports.update_public_static_drop_data = functions.firestore.document( `static_drop_private/{drop_id}` ).onWrite( update_public_static_drop_data )

// Public health check
exports.public_health_check = functions.https.onRequest( public_health_check )