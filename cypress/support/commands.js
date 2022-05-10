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

	} ).as( 'google_tag_stub' )


} )

// Scan a QR and claim the challenge
Cypress.Commands.add( 'claim_challenge', ( challenge_string, alias, start ) => {


	start = start || Date.now()
	const elapsed = f => ( Date.now() - start ) / 1000

	cy.log( `[ ${ elapsed() }s ] Claiming event challenge: ${ challenge_string }` )

	// Visit the challenge link
	cy.visit( `/` )
	cy.visit( `/claim/${ challenge_string }` )

	// Check that backend redirected us to the claim page
	cy.url().should( 'include', '/#/claim' )

	// Wait for code retreival
	cy.contains( 'POAP link' )

	cy.log( `[ ${ elapsed() }s ] Completed challenge ${ alias }: ${ challenge_string }` )

} )

Cypress.Commands.add( 'get_challenge_from_qr_public_auth', ( public_auth_string, alias, start ) => {

	async function extract_challenge_from_url ( response ) {

		const { redirects } = response
		if( !Array.isArray( redirects ) ) cy.log( redirects )
		const [ challenge_url ] = redirects
		const [ base, challenge_redirect ] = challenge_url.split( '/#/claim/' )
		const challenge = challenge_redirect.replace( '307: ' )
		cy.log( `[ ${ elapsed() } ] Extracted challenge: ${challenge} from ${ challenge_url }` )
		return challenge

	}

	const request_options = {
		headers: {
			Host: new URL( Cypress.env( 'REACT_APP_publicUrl' ) ).host
		},
		failOnStatusCode: false
	}

	start = start || Date.now()
	const elapsed = f => ( Date.now() - start ) / 1000

	cy.log( `[ ${ elapsed() } ] Simulating QR scan for ${ alias }` )

	cy.request( { ...request_options, url: `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ public_auth_string }?CI=true` } )
	.then( extract_challenge_from_url )
	.then( challenge => cy.wrap( challenge ).as( alias ) )

} )