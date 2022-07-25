
context( "Admin interface", () => {



	it( 'Can view export interface', () => {

		// Visit admin page
		cy.visit( `/static/admin/export` )

		// Page renders
				cy.contains( `Static QR Drop Export` )
				cy.contains( `Drop ID` )
				cy.contains( `Secret Edit Code` )
				cy.contains( `Authentication code` )
				cy.contains( `Authenticate and Export` )

	} )

	it( 'Can view creation interface', () => {

		// Visit admin page
		cy.visit( `/static/admin/create` )

		// Page renders
				cy.contains( `Static QR Drop Creation` )
				cy.contains( `Drop ID` )
				cy.contains( `Opt-in` )
				cy.contains( `Create static drop` )

	} )


} )
