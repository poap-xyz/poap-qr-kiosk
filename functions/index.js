const functions = require("firebase-functions")
const generousRuntime = {
	timeoutSeconds: 540,
	memory: '4GB'
}

// ///////////////////////////////
// Check status against live env
// ///////////////////////////////

// Trigger check from frontend
const { refreshOldUnknownCodes, checkIfCodeHasBeenClaimed, refreshScannedCodesStatuses } = require( './modules/codes' )

exports.checkIfCodeHasBeenClaimed = functions.https.onCall( checkIfCodeHasBeenClaimed )
exports.requestManualCodeRefresh = functions.runWith( generousRuntime ).https.onCall( refreshOldUnknownCodes )

// Periodically check old unknown codes
exports.refreshOldUnknownStatusses = functions.runWith( generousRuntime ).pubsub.schedule( 'every 5 minutes' ).onRun( f => refreshOldUnknownCodes( 'cron', { app: true } ) )

// Allow frontend to trigger updates for scanned codes
exports.refreshScannedCodesStatuses = functions.runWith( generousRuntime ).https.onCall( refreshScannedCodesStatuses )

// ///////////////////////////////
// Load codes submitted in frontend
// ///////////////////////////////

const { registerEvent, deleteEvent } = require( './modules/events' )

exports.registerEvent = functions.runWith( generousRuntime ).https.onCall( registerEvent )
exports.deleteEvent = functions.https.onCall( deleteEvent )

// ///////////////////////////////
// Middleware API
// ///////////////////////////////
const claimMiddleware = require( './modules/claim' )
exports.claimMiddleware = functions.https.onRequest( claimMiddleware )

// ///////////////////////////////
// Housekeeping
// ///////////////////////////////

const { deleteExpiredCodes, updatePublicEventAvailableCodes } = require( './modules/codes' )
const { deleteCodesOfDeletedEvent, updatePublicEventData } = require( './modules/events' )

exports.deleteExpiredCodes = functions.runWith( generousRuntime ).pubsub.schedule( 'every 24 hours' ).onRun( deleteExpiredCodes )
exports.deleteCodesOfDeletedEvent = functions.firestore.document( `events/{eventId}` ).onDelete( deleteCodesOfDeletedEvent )
exports.updatePublicEventData = functions.firestore.document( `events/{eventId}` ).onWrite( updatePublicEventData )
exports.updatePublicEventAvailableCodes = functions.firestore.document( `codes/{codeId}` ).onWrite( updatePublicEventAvailableCodes )



/* ///////////////////////////////
// Security
// /////////////////////////////*/
const { validateCallerDevice } = require( './modules/security' )
exports.validateCallerDevice = functions.https.onCall( validateCallerDevice )
