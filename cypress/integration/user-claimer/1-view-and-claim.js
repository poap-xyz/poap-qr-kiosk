/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )
const codes = require( '../../fixtures/two-correct-codes' )

context( 'Can view valid event', () => {



	it( 'Creates event', () => {

		// Visit creation interface
		cy.visit( '/create' )

		// Input the event data
		cy.get( 'input[type=file]' ).attachFile( `two-correct-codes.txt` )
		cy.get( '#event-create-name' ).type( admin.name )
		cy.get( '#event-create-email' ).type( admin.email )
		cy.get( '#event-create-date' ).type( admin.event.end )

		// Create event
		cy.get( '#event-create-submit' ).click()

		// Verify that the new url is the admin interface
		cy.url().should( 'include', '/event/admin' )

		// Save the event and admin links for further use
		cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'publiclink' )
		cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'secretlink' )

	} )

	it( 'Can view event', function() {

		// Visit the public interface
		cy.visit( this.publiclink )

		// Check that a valid QR is shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).should( 'be.oneOf', codes )

		// Save the first code shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'firstcode' )

	} )

	it( 'Shows different code after first is scanned', async function( ) {

		// Mark the first code as read by simulating a scan
		await fetch( `https://poap-qr-kiosk.web.app/claim/${ this.firstcode }`, {
			mode: 'no-cors'
		} )

		// Visit the public link
		cy.visit( this.publiclink )

		// Check that the QR shows an unused code and save the second code
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'secondcode' )
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).should( 'eq', codes.find( code => code != this.firstcode ) )

	} )

	it( 'Shows no codes after both are scanned', async function( ) {

		// Mark the second code as read by simulating a scan
		await fetch( `https://poap-qr-kiosk.web.app/claim/${ this.secondcode }`, {
			mode: 'no-cors'
		} )
		cy.visit( this.publiclink )
		cy.contains( 'No codes available' )

	} )



	it( 'Deletes the event when clicked', function() {

		cy.visit( this.secretlink )

		cy.on('window:alert', response => {
			expect( response ).to.contain( 'Deletion success' )
		} )
		cy.on('window:confirm', response => {
			expect( response ).to.contain( 'Are you sure' )
		} )

		cy.contains( 'Delete event' ).click()
		cy.contains( 'Deleting event' )

		cy.url().should( 'eq', Cypress.config().baseUrl + '/' )
	} )

} )