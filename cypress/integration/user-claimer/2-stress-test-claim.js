/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )
const fiveCodes = require( `../../fixtures/five-correct-codes${ Cypress.env('LOCAL') ? '' : '-ci' }` )
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

	const start = Date.now()

	/* ///////////////////////////////
	// Large event
	// /////////////////////////////*/

	it( 'Large event: Creates event', function() {

		// Visit creation interface
		cy.visit( '/create?debug=true' )

		// Input the event data
		cy.get( 'input[type=file]' ).attachFile( Cypress.env('LOCAL') ? `five-correct-codes.txt` : `five-correct-codes-ci.txt` )
		cy.get( '#event-create-name' ).type( admin.events[1].name )
		cy.get( '#event-create-email' ).clear().type( admin.email )
		cy.get( '#event-create-date' ).type( admin.events[1].end )

		// Select no anti-farming
		cy.get( '#event-create-game-enabled' ).select( 0 )

		// Create event
		cy.get( '#event-create-submit' ).click()

		// Verify that the new url is the admin interface
		cy.url().should( 'include', '/event/admin' )

		// Save the event and admin links for further use
		cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'publiclink' ).then( f => cy.log( this.publiclink ) )
		cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'secretlink' ).then( f => cy.log( this.secretlink ) )


	} )

	it( 'Can view event', function() {

		// Visit the public interface
		cy.visit( this.publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Save the first public auth link shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'public_auth_link' ).then( f => cy.log( `Event 2 public auth link: ${ this.public_auth_link }` ) )

	} )

	
	it( 'Successfully gets 3 challenge links', function( ) {


		// Scan in rapid succession
		cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_one`, start ).as( `challenge_one` )
		cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_two`, start ).as( `challenge_two` )
		cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_three`, start ).as( `challenge_three` )
		// cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_four`, start ).as( `challenge_four` )
		// cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_five`, start ).as( `challenge_five` )


	} )

	it( 'Successfully claims 3 challenge links', function( ) {

		// Scan in rapid succession
		cy.claim_challenge( this.challenge_one, `challenge_one`, start )
		cy.claim_challenge( this.challenge_two, `challenge_two`, start )
		cy.claim_challenge( this.challenge_three, `challenge_three`, start )
		// cy.claim_challenge( this.challenge_four, `challenge_four`, start )
		// cy.claim_challenge( this.challenge_five, `challenge_five`, start )


	} )

	it( 'Shows codes marked as used (previous redirect marked as used)', function( ) {

		// Visit the public link
		cy.visit( this.publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Shows one code as claimed
		cy.contains( '3 of 5 codes' )

	} )

	it( 'Successfully gets challenge link through old public auth (should work ONCE)', function( ) {

		const auth_expires_ms = 1000 * ( 30 + 5 ) // functions/events.js:45 plus grace period at functions/claim.js:37

		cy.wait( auth_expires_ms )
		cy.log( this.public_auth_link )
		cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_four`, start ).then( challenge => {

			expect( challenge ).to.not.contain( 'robot' )

		} )
			

	} )

	it( 'Fails getting challenge link through old public auth', function( ) {

		const auth_expires_ms = 1000 * ( 30 + 5 ) // functions/events.js:45 plus grace period at functions/claim.js:37

		cy.wait( auth_expires_ms )

		cy.log( this.public_auth_link )
		cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_five`, start ).then( challenge => {

			expect( challenge ).to.contain( 'robot' )

		} )


	} )


	it( 'Deletes the event when clicked', function() {

		cy.log( this.challenge_one )
		cy.log( this.challenge_two )

		cy.visit( this.secretlink )

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