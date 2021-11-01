const express = require( 'express' )
const cors = require( 'cors' )

// CORS enabled express generator
module.exports = f => {

	// Create express server
	const app = express()

	// Enable CORS
	app.use( cors( { origin: true } ) )

	return app

}
