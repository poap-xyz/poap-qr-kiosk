/* ///////////////////////////////
// Welcome page UX tests
// /////////////////////////////*/

context( 'Welcome page', () => {

	it( 'Has a link to create a QR kiosk', () => {

		cy.visit( '/' )
		cy.contains( 'Create QR kiosk' )

	} )

	it( 'Clicking the create QR button leads to the admin interface', () => {

		cy.visit( '/' )
		cy.contains( 'Create QR kiosk' ).click()
		cy.url().should( 'include', '/create' )
		
	} )

} )