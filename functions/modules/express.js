const express = require( 'express' )
const cors = require( 'cors' )
const bodyParser = require('body-parser')

// CORS enabled express generator
module.exports = f => {

	// Create express server
	const app = express()

	// Enable CORS
	app.use( cors( { origin: true } ) )

	// Enable body parser
	app.use( bodyParser.json() )

	return app

}
