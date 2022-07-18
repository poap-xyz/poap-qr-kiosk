
context( "Admin interface", () => {



    it( 'Can view export interface', () => {

		// Visit admin page
		cy.visit( `/static/admin/export` )

		// Page renders
        cy.contains( `Static QR Drop Export` )
        cy.contains( `Drop ID` )
        cy.contains( `Secret Edit Code` )
        cy.contains( `authentication code` )
        cy.contains( `Authenticate and Export` )

	} )


} )
