/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )
const twoCodes = require( '../../fixtures/two-correct-codes' )
const fiveCodes = require( '../../fixtures/five-correct-codes' )

context( 'Claimer can view valid events', () => {

	/* ///////////////////////////////
	// First event
	// /////////////////////////////*/

	it( 'Event 1: Creates event', () => {

		// Visit creation interface
		cy.visit( '/create?debug=true' )

		// Input the event data
		cy.get( 'input[type=file]' ).attachFile( `two-correct-codes.txt` )
		cy.get( '#event-create-name' ).type( admin.events[0].name )
		cy.get( '#event-create-email' ).type( admin.email )
		cy.get( '#event-create-date' ).type( admin.events[0].end )

		// Create event
		cy.get( '#event-create-submit' ).click()

		// Verify that the new url is the admin interface
		cy.url().should( 'include', '/event/admin' )

		// Save the event and admin links for further use
		cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' )
		cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' )

	} )

	it( 'Event 1: Can view event', function() {

		// Visit the public interface
		cy.visit( this.event_1_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Check that a valid QR is shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).should( 'be.oneOf', twoCodes )

		// Save the first code shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_firstcode' )

	} )

	it( 'Event 1: Shows different code after first is scanned', function( ) {

		// Mark the first code as read by simulating a scan
		cy.request( `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_1_firstcode }` )

		// Visit the public link
		cy.visit( this.event_1_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Check that the QR shows an unused code and save the second code
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_secondcode' )
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).should( 'eq', twoCodes.find( code => code != this.event_1_firstcode ) )

	} )

	it( 'Event 1: Shows code marked as used', function( ) {

		// Mark the first code as read by simulating a scan
		cy.request( `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_1_firstcode }` )

		// Visit the public link
		cy.visit( this.event_1_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Shows one code as claimed
		cy.contains( '1 of 2 codes claimed' )

	} )

	it( 'Event 1: Shows no codes after both are scanned', function( ) {

		// Mark the second code as read by simulating a scan
		cy.request( `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_1_secondcode }` )
		cy.visit( this.event_1_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		cy.contains( 'No codes available' )
		cy.get( 'svg[data-code]' ).should( 'not.exist' )

	} )

	/* ///////////////////////////////
	// Second event
	// /////////////////////////////*/

	it( 'Event 2: Creates event', () => {

		// Visit creation interface
		cy.visit( '/create?debug=true' )

		// Input the event data
		cy.get( 'input[type=file]' ).attachFile( `five-correct-codes.txt` )
		cy.get( '#event-create-name' ).type( admin.events[1].name )
		cy.get( '#event-create-email' ).type( admin.email )
		cy.get( '#event-create-date' ).type( admin.events[1].end )

		// Create event
		cy.get( '#event-create-submit' ).click()

		// Verify that the new url is the admin interface
		cy.url().should( 'include', '/event/admin' )

		// Save the event and admin links for further use
		cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_2_publiclink' )
		cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_2_secretlink' )

	} )

	it( 'Event 2: Can view event', function() {

		// Visit the public interface
		cy.visit( this.event_2_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Check that a valid QR is shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).should( 'be.oneOf', fiveCodes )

		// Save the first code shown
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_2_firstcode' )

	} )

	it( 'Event 2: Shows different code after first is scanned', function( ) {

		// Mark the first code as read by simulating a scan
		cy.request( `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_2_firstcode }` )

		// Visit the public link
		cy.visit( this.event_2_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Check that the QR shows an unused code and save the second code
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_2_secondcode' )
		cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).should( 'eq', fiveCodes.find( code => code != this.event_2_firstcode ) )

	} )

	it( 'Event 2: Shows code marked as used', function( ) {

		// Mark the first code as read by simulating a scan
		cy.request( `${ Cypress.env( 'REACT_APP_publicUrl' ) }/claim/${ this.event_2_firstcode }` )

		// Visit the public link
		cy.visit( this.event_2_publiclink )

		// Accept disclaimer
		cy.get( '#event-view-accept-disclaimer' ).click()

		// Shows one code as claimed
		cy.contains( '1 of 5 codes claimed' )

	} )


	it( 'Event 1: Deletes the event when clicked', function() {

		cy.visit( this.event_1_secretlink )

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

	it( 'Event 2: Deletes the event when clicked', function() {

		cy.visit( this.event_2_secretlink )

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