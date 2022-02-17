// Firebase interactors
const { initializeApp } = require("firebase-admin/app")
const { getFirestore, FieldValue } = require( 'firebase-admin/firestore' )
const app = initializeApp()
const db = getFirestore( app )

const dataFromSnap = ( snapOfDocOrDocs, withDocId=true ) => {
	
	// If these are multiple docs
	if( snapOfDocOrDocs.docs ) return snapOfDocOrDocs.docs.map( doc => ( { uid: doc.id, ...doc.data( ) } ) )

	// If this is a single document
	return { ...snapOfDocOrDocs.data(), ...( withDocId && { uid: snapOfDocOrDocs.id } ) }

}


module.exports = {
	db: db,
	app: app,
	dataFromSnap: dataFromSnap,
	increment: FieldValue.increment,
	arrayUnion: FieldValue.arrayUnion
}