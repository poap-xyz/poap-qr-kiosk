/* ///////////////////////////////
// Welcome page UX tests
// /////////////////////////////*/


context( 'Welcome page QR Dispenser', () => {


	it( 'Has a link to create a QR kiosk, and a base language of English', () => {

		cy.visit( '/?debug=true' )
		
		// expect the homescreen in EN
		cy.contains( 'Create QR dispenser' )

	} )

	it( 'Has a dropdown for language switching, and the dropdown switches the language to Dutch', () => {

		cy.visit( '/?debug=true' )

		cy.contains( 'select', 'πΊπΈ' )

		cy.get('select').select('π³π±')

		cy.contains( 'select', 'π³π±' )

		cy.contains( 'Magische POAP Dispenser' )
		
	} )

} )