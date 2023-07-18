/* ///////////////////////////////
// Welcome page UX tests
// /////////////////////////////*/


context( 'Welcome page UX', () => {

    it( 'Clicking the create QR button leads to the admin interface', () => {

        cy.visit( '/?debug=true' )

        cy.contains( 'Create Kiosk' ).click()
        cy.url().should( 'include', '/create' )
        
    } )

} )