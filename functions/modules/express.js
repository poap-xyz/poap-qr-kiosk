// Cached express instance
let app = undefined;

// CORS enabled express generator
module.exports = (f) => {
	// If cached, return
	if (app) return app;

	// Function dependencies
	const express = require("express");
	const cors = require("cors");
	const bodyParser = require("body-parser");

	// Create express server
	app = express();

	// Enable CORS
	app.use(cors({ origin: true }));

	// Enable body parser
	app.use(bodyParser.json());

	return app;
};
