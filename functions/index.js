const functions = require("firebase-functions")
const generousRuntime = {
	timeoutSeconds: 540,
	memory: '4GB'
}

// ///////////////////////////////
// Code status managers
// ///////////////////////////////

const { checkIfCodeHasBeenClaimed, refreshScannedCodesStatuses, refreshOldUnknownCodes, getEventDataFromCode } = require( './modules/codes' )

// Get event data of a code
exports.getEventDataFromCode = functions.https.onCall( getEventDataFromCode )

// Refresh all codes ( trigger from frontend )
exports.requestManualCodeRefresh = functions.runWith( generousRuntime ).https.onCall( refreshOldUnknownCodes )

// Check status of single code
// exports.checkIfCodeHasBeenClaimed = functions.https.onCall( checkIfCodeHasBeenClaimed )

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
exports.claimMiddleware = functions.https.onRequest( claimMiddleware )

// ///////////////////////////////
// Housekeeping
// ///////////////////////////////

const { deleteExpiredCodes, updatePublicEventAvailableCodes } = require( './modules/codes' )
const { deleteCodesOfDeletedEvent, updatePublicEventData } = require( './modules/events' )

// Delete items where parents were deleted
exports.deleteExpiredCodes = functions.runWith( generousRuntime ).pubsub.schedule( 'every 24 hours' ).onRun( deleteExpiredCodes )
exports.deleteCodesOfDeletedEvent = functions.firestore.document( `events/{eventId}` ).onDelete( deleteCodesOfDeletedEvent )

// Update items where parents were updated
exports.updatePublicEventData = functions.firestore.document( `events/{eventId}` ).onWrite( updatePublicEventData )
exports.updatePublicEventAvailableCodes = functions.firestore.document( `codes/{codeId}` ).onWrite( updatePublicEventAvailableCodes )



/* ///////////////////////////////
// Security
// /////////////////////////////*/
const { validateCallerDevice } = require( './modules/security' )
exports.validateCallerDevice = functions.https.onCall( validateCallerDevice )

/* ///////////////////////////////
// Code claiming
// /////////////////////////////*/
const { get_code_by_challenge } = require( './modules/codes' )
exports.get_code_by_challenge = functions.https.onCall( get_code_by_challenge )