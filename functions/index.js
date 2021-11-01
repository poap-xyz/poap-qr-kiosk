const functions = require("firebase-functions")
// const fs = require( 'fs' ).promises

// Code verifications
const { importCodes, verifyCodeStatus } = require( './modules/codes' )

// APIs
const claimMiddleware = require( './modules/claim' )

// ///////////////////////////////
// Check status against live env
// ///////////////////////////////
exports.verifyCodeStatus = functions.firestore.document( 'codes/{code}' ).onWrite( verifyCodeStatus )

// ///////////////////////////////
// Load codes submitted in frontend
// ///////////////////////////////
exports.importCodes = functions.https.onCall( importCodes )

// ///////////////////////////////
// Middleware API
// ///////////////////////////////
exports.claimMiddleware = functions.https.onRequest( claimMiddleware )