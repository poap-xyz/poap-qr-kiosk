// File upload test helper
import 'cypress-file-upload'

// Stub google analytics requests
beforeEach( () => {

	cy.intercept( 'https://www.googletagmanager.com/**/*', { middleware: true }, req => {

		// Disable request caching
		req.on( 'before:response', (res) => {
			// force all API responses to not be cached
			res.headers['cache-control'] = 'no-store'
		} )

		// Respond with a stubbed function
		req.reply( ' () => console.log( "Stubbed Google Analytics" )' )

	} )


} )