const functions = require("firebase-functions")
const generousRuntime = {
	timeoutSeconds: 540,
	memory: '4GB'
}

// Code verifications
const { importCodes, refreshOldUnknownCodes, checkIfCodeHasBeenClaimed } = require( './modules/codes' )

// APIs
const claimMiddleware = require( './modules/claim' )

// ///////////////////////////////
// Check status against live env
// ///////////////////////////////

// Trigger check from frontend
exports.checkIfCodeHasBeenClaimed = functions.https.onCall( checkIfCodeHasBeenClaimed )
exports.requestManualCodeRefresh = functions.runWith( generousRuntime ).https.onCall( f => refreshOldUnknownCodes() )

// Periodically check old unknown codes
exports.refreshOldUnknownStatusses = functions.runWith( generousRuntime ).pubsub.schedule( 'every 5 minutes' ).onRun( refreshOldUnknownCodes )

// ///////////////////////////////
// Load codes submitted in frontend
// ///////////////////////////////
exports.importCodes = functions.runWith( generousRuntime ).https.onCall( importCodes )

// ///////////////////////////////
// Middleware API
// ///////////////////////////////
exports.claimMiddleware = functions.https.onRequest( claimMiddleware )