/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )
const twoCodes = require( '../../fixtures/two-correct-codes' )
const fiveCodes = require( '../../fixtures/five-correct-codes' )
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

context( 'Claimer can view valid events', () => {

	/* ///////////////////////////////
	// First event
	// /////////////////////////////*/

	it( 'Event 1: Creates event', function() {

		// Visit creation interface
		cy.visit( '/create?debug=true' )

		// Input the event data
		cy.get( 'input[type=file]' ).attachFile( `two-correct-codes.txt` )
		cy.get( '#event-create-name' ).type( admin.events[0].name )
		cy.get( '#event-create-email' ).type( admin.email )
		cy.get( '#event-create-date' ).type( admin.events[0].end )

		// Select no anti-farming
		cy.get( '#event-create-game-enabled' ).select( 1 )

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

	it( 'Event 1: Successfully redirects to challenge link', function( ) {


		// Visit the public link
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

				// Wait for code retreival
				cy.contains( 'POAP link' )

				// Check if POAP link supplies one of the test codes
				cy.get( '#loading_text' ).invoke( 'text' ).then( text => {
					const [ base, code ] = text.split( '/claim/' )
					expect( code ).to.be.oneOf( twoCodes )
				} )

			} )
		

	} )

	it( 'Event 1: Shows code marked as used (previous redirect marked as used)', function( ) {

		// Visit the public link
		cy.visit( this.event_1_publiclink )


		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Shows one code as claimed
		cy.contains( '1 of 2 codes' )

	} )

	it( 'Event 1: Previous challenge link no longer works', function( ) {

		// Visit the public link
		cy.visit( this.event_1_first_challenge_url )

		// Interface should indicate that the link expired
		cy.contains( 'This link was already used' )

	} )

	it( 'Event 1: Shows no codes after both are scanned', function( ) {

		// Visit the public link to the second code as read by simulating a scan
		cy.request( { ...request_options, url: `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_1_public_auth_link }` } ).as( `request` )
			.then( extract_challenge_from_url )
			.then( event_1_second_challenge => {

				// Visit the challenge link
				cy.visit( `/claim/${ event_1_second_challenge }` )

				// Wait for code retreival
				cy.contains( 'POAP link' )

				// Check if POAP link supplies one of the test codes
				cy.get( '#loading_text' ).invoke( 'text' ).then( text => {
					const [ base, code ] = text.split( '/claim/' )
					expect( code ).to.be.oneOf( twoCodes )
				} )

			} )

		// Visit public event link
		cy.visit( this.event_1_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		cy.contains( '2 of 2 codes' )

	} )

	it( 'Event 1: Shows error if link was used after codes ran out', function( ) {

		// Visit the public link to the second code as read by simulating a scan
		cy.request( { ...request_options, url: `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_1_public_auth_link }` } ).as( `request` )
			.then( extract_challenge_from_url )
			.then( event_1_second_challenge => {

				// Visit the challenge link
				cy.visit( `/claim/${ event_1_second_challenge }` )

				// // Wait for code retreival
				cy.contains( 'No more POAP' )

			} )

	} )

	/* ///////////////////////////////
	// Second event
	// /////////////////////////////*/

	it( 'Event 2: Creates event', function() {

		// Visit creation interface
		cy.visit( '/create?debug=true' )

		// Input the event data
		cy.get( 'input[type=file]' ).attachFile( `five-correct-codes.txt` )
		cy.get( '#event-create-name' ).type( admin.events[1].name )
		cy.get( '#event-create-email' ).type( admin.email )
		cy.get( '#event-create-date' ).type( admin.events[1].end )

		// Select no anti-farming
		cy.get( '#event-create-game-enabled' ).select( 1 )

		// Create event
		cy.get( '#event-create-submit' ).click()

		// Verify that the new url is the admin interface
		cy.url().should( 'include', '/event/admin' )

		// Save the event and admin links for further use
		cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_2_publiclink' ).then( f => cy.log( this.event_2_publiclink ) )
		cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_2_secretlink' ).then( f => cy.log( this.event_2_secretlink ) )


	} )

	it( 'Event 2: Can view event', function() {

		// Visit the public interface
		cy.visit( this.event_2_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Save the first public auth link shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_2_public_auth_link' ).then( f => cy.log( `Event 2 public auth link: ${ this.event_2_public_auth_link }` ) )

	} )

	
	it( 'Event 2: Successfully redirects to challenge link', function( ) {


		// Visit the public link
		cy.request( { ...request_options, url: `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_2_public_auth_link }` } ).as( `request` )
			.then( extract_challenge_from_url )
			.then( event_2_first_challenge => {

				// Visit the challenge link
				cy.visit( `/claim/${ event_2_first_challenge }` )

				// Save challenge link
				cy.url().as( 'event_2_first_challenge_url' )

				// Check that backend redirected us to the claim page
				cy.url().should( 'include', '/#/claim' )

				// Expect the interface to check if we are human
				cy.contains( 'Verifying your humanity' )

				// Wait for code retreival
				cy.contains( 'POAP link' )

				// Check if POAP link supplies one of the test codes
				cy.get( '#loading_text' ).invoke( 'text' ).then( text => {
					const [ base, code ] = text.split( '/claim/' )
					expect( code ).to.be.oneOf( fiveCodes )
				} )

			} )
		

	} )

	it( 'Event 2: Shows code marked as used (previous redirect marked as used)', function( ) {

		// Visit the public link
		cy.visit( this.event_2_publiclink )


		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Shows one code as claimed
		cy.contains( '1 of 5 codes' )

	} )

	it( 'Event 2: Previous challenge link no longer works', function( ) {

		// Visit the public link
		cy.visit( this.event_2_first_challenge_url )

		// Interface should indicate that the link expired
		cy.contains( 'This link was already used' )

	} )


	it( 'Event 1: Deletes the event when clicked', function() {

		cy.visit( this.event_1_secretlink )

		cy.on('window:alert', response => {
			expect( response ).to.contain( 'Deletion success' )
		} )
		cy.on('window:confirm', response => {
			expect( response ).to.contain( 'Are you sure' )
		} )

		cy.contains( 'Delete QR dispenser' ).click()
		cy.contains( 'Delete QR Dispenser' )

		cy.url().should( 'eq', Cypress.config().baseUrl + '/' )
	} )

	it( 'Event 2: Deletes the event when clicked', function() {

		cy.visit( this.event_2_secretlink )

		cy.on('window:alert', response => {
			expect( response ).to.contain( 'Deletion success' )
		} )
		cy.on('window:confirm', response => {
			expect( response ).to.contain( 'Are you sure' )
		} )

		cy.contains( 'Delete QR dispenser' ).click()
		cy.contains( 'Delete QR Dispenser' )

		cy.url().should( 'eq', Cypress.config().baseUrl + '/' )
	} )

} )