/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )

context( 'Successful event creation', () => {

	it( 'Has all required fields', () => {

		cy.visit( '/create' )
		cy.contains( 'label', 'Event name' )
		cy.contains( 'label', 'Your email' )
		cy.contains( 'label', 'Event end date' )
		cy.contains( 'label', 'Select .txt file with codes' )

	} )

	it( 'Shows no button if no file was selected', () => {

		cy.get( 'button' ).should( 'not.exist' )

	} )

	it( 'Shows the amount of codes in a selected .txt file', () => {

		cy.get( 'input[type=file]' ).attachFile( `two-correct-codes.txt` )
		cy.contains( 'Create event with 2 codes' )
		cy.contains( 'Upload different codes' )

	} )

	it( 'Succeeds when all data is provided', () => {

		let alerts = 0
		cy.on( 'window:alert', response => {
			alerts++
			if( alerts == 1 ) expect( response ).to.contain( 'specify an event name' )
			if( alerts == 2 ) expect( response ).to.contain( 'specify a valid email address' )
			if( alerts == 3 ) expect( response ).to.contain( 'specify the date' )
		} )

		cy.get( '#event-create-submit' ).click()
		cy.get( '#event-create-name' ).type( admin.name )

		cy.get( '#event-create-submit' ).click()
		cy.get( '#event-create-email' ).type( admin.email )

		cy.get( '#event-create-submit' ).click()
		cy.get( '#event-create-date' ).type( admin.event.end )

		cy.get( '#event-create-submit' ).click()

		cy.contains( 'Creating event' )
		cy.url().should( 'include', '/event/admin' )

		cy.contains( 'Your public event link' )
		cy.contains( 'Your secret admin link' )

	} )

	it( 'Deletes the event when clicked', () => {

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