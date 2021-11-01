const functions = require("firebase-functions")
// const fs = require( 'fs' ).promises

// Code verifications
const { importCodes, verifyCodeStatusIfUnknownStatus, refreshOldUnknownCodes } = require( './modules/codes' )

// APIs
const claimMiddleware = require( './modules/claim' )

// ///////////////////////////////
// Check status against live env
// ///////////////////////////////

// On write, check remote status if the code was set to unknown
exports.verifyCodeStatusIfUnknownStatus = functions.firestore.document( 'codes/{code}' ).onWrite( verifyCodeStatusIfUnknownStatus )

// Periodically check old unknown codes
exports.refreshOldUnknownStatusses = functions.pubsub.schedule( 'every 60 minutes' ).onRun( refreshOldUnknownCodes )

// ///////////////////////////////
// Load codes submitted in frontend
// ///////////////////////////////
exports.importCodes = functions.https.onCall( importCodes )

// ///////////////////////////////
// Middleware API
// ///////////////////////////////
exports.claimMiddleware = functions.https.onRequest( claimMiddleware )