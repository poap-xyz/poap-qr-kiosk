const functions = require("firebase-functions")
// const fs = require( 'fs' ).promises

// Code verifications
const { importCodes, refreshOldUnknownCodes, checkIfCodeHasBeenClaimed } = require( './modules/codes' )

// APIs
const claimMiddleware = require( './modules/claim' )

// ///////////////////////////////
// Check status against live env
// ///////////////////////////////

// Trigger check from frontend
exports.checkIfCodeHasBeenClaimed = functions.https.onCall( checkIfCodeHasBeenClaimed )
exports.requestManualCodeRefresh = functions.https.onCall( f => refreshOldUnknownCodes() )

// Periodically check old unknown codes
exports.refreshOldUnknownStatusses = functions.pubsub.schedule( 'every 5 minutes' ).onRun( refreshOldUnknownCodes )

// ///////////////////////////////
// Load codes submitted in frontend
// ///////////////////////////////
exports.importCodes = functions.https.onCall( importCodes )

// ///////////////////////////////
// Middleware API
// ///////////////////////////////
exports.claimMiddleware = functions.https.onRequest( claimMiddleware )