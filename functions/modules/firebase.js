// Firebase interactors
const { initializeApp } = require("firebase-admin/app")
const { getFirestore } = require( 'firebase-admin/firestore' )
const app = initializeApp()
const db = getFirestore( app )

module.exports = {
	db: db,
	app: app
}