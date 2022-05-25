/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )
const request_options = {

	headers: {
		Host: new URL( Cypress.env( 'REACT_APP_publicUrl' ) ).host
	},
	failOnStatusCode: false

}

async function extract_challenge_from_url ( response ) {

	const { redirects } = response
	const [ challenge_url ] = redirects
	cy.log( `Redirect: `, challenge_url )
	const [ base, challenge_redirect ] = challenge_url.split( '/#/claim/' )
	const challenge = challenge_redirect.replace( '307: ' )
	cy.log( `Challenge extracted: ${challenge}` )
	return challenge

}

context( 'User can claim POAP after succeeding at challenge game', () => {

	/* ///////////////////////////////
	// First event
	// /////////////////////////////*/

	it( 'Event 1: Creates event', function() {

		// Visit creation interface
		cy.visit( '/create?debug=true' )

		// Input the event data
		cy.get( 'input[type=file]' ).attachFile( Cypress.env('LOCAL') ? `one-correct-code.txt` : `one-correct-code-ci.txt` )
		cy.get( '#event-create-name' ).type( admin.events[0].name )
		cy.get( '#event-create-email' ).clear().type( admin.email )
		cy.get( '#event-create-date' ).type( admin.events[0].end )

		// Select YES to anti-farming
		cy.get( '#event-create-game-enabled' ).select( 1 )

		// Select anti-farming timing (10s)
		cy.get( '#event-create-game-duration' ).select( 1 )
		cy.log( 'Game time selected: 10s AKA 2 game turns' )

		// Create event
		cy.get( '#event-create-submit' ).click()

		// Verify that the new url is the admin interface
		cy.url().should( 'include', '/event/admin' )

		// Save the event and admin links for further use
		cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' ).then( f => cy.log( this.event_1_publiclink ) )
		cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

	} )

	it( 'Event 1: Can view event', function() {

		// Visit the public interface
		cy.visit( this.event_1_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Save the first public auth link shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

	} )

	it( 'Event 1: Succesfully redirects to challenge link and fail at game', function( ) {

		// Visit the public link with games
		cy.request( { ...request_options, url: `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_1_public_auth_link }` } ).as( `request` )
			.then( extract_challenge_from_url )
			.then( event_1_first_challenge => {

				// Visit the challenge link
				cy.visit( `/claim/${ event_1_first_challenge }` )

				// Save challenge link
				cy.url().as( 'event_1_first_challenge_url' )

				// Check that backend redirected us to the claim page
				cy.url().should( 'include', '/#/claim' )

				// Expect the interface to check if we are human
				cy.contains( 'Verifying your humanity' )
				
				// Expect response after human validation
				cy.contains( 'Prepping your POAP' )
				
				// Human game welcome screen 
				cy.contains( 'Play a game' )

				// Click start game button
				cy.contains( 'button', 'Start game' ).click()

				// Expect score text
				cy.contains( 'Score: 0 of' )

				// Expect winning screen
				cy.contains( 'You lost!' )

			} )
	
	} )

	it( 'Event 1: Shows code not marked as used after failing game', function( ) {

		// Visit the public link
		cy.visit( this.event_1_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Shows one code as claimed
		cy.contains( '0 of 1 codes' )

	} )


	// Delete event 1
	it( 'Event 1: Deletes the event when clicked', function() {

		cy.visit( this.event_1_secretlink )

		cy.on('window:alert', response => {
			expect( response ).to.contain( 'Deletion success' )
		} )
		cy.on('window:confirm', response => {
			expect( response ).to.contain( 'Are you sure' )
		} )

		cy.contains( 'Delete QR dispenser' ).click()

		cy.url().should( 'eq', Cypress.config().baseUrl + '/' )
	} )

} )