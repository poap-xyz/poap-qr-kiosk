// Firebase interactors
const { initializeApp } = require( "firebase-admin/app" )
const { getFirestore, FieldValue } = require( 'firebase-admin/firestore' )

// Cached app instalce
let cached_app = undefined
const get_app = () => {
    if( cached_app ) return cached_app
    cached_app = initializeApp()
    return cached_app
}

// Cached firestore instalce
let cached_db = undefined
const get_db = () => {
    if( cached_db ) return cached_db
    cached_db = getFirestore( get_app() )
    return cached_db
}

// Get cached instances
const app = get_app()
const db = get_db()

const dataFromSnap = ( snapOfDocOrDocs, withDocId=true ) => {
	
    // If these are multiple docs
    if( snapOfDocOrDocs.docs ) return snapOfDocOrDocs.docs.map( doc => ( { uid: doc.id, ...doc.data( ) } ) )

    // If this is a single document
    return { ...snapOfDocOrDocs.data(), ... withDocId && { uid: snapOfDocOrDocs.id }  }

}


module.exports = {
    db: db,
    app: app,
    dataFromSnap: dataFromSnap,
    increment: FieldValue.increment,
    arrayUnion: FieldValue.arrayUnion
}