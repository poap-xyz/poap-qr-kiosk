/* ///////////////////////////////
// Welcome page UX tests
// /////////////////////////////*/

context("Welcome page POAP Kiosk", () => {
	it("Has a link to create a QR kiosk, and a base language of English", () => {
		cy.visit("/?debug=true");

		// Cookie should have Dutch Value
		cy.getCookie("i18next").should("have.property", "value", "en");

		// expect the homescreen in EN
		cy.contains("Create Kiosk");
	});

	// it( 'Has a dropdown for language switching, and the dropdown switches the language to Dutch', () => {

	//     cy.visit( '/?debug=true' )

	//     cy.contains( 'select', '🇺🇸' )

	//     cy.get( 'select' ).select( '🇳🇱' )

	//     cy.contains( 'POAP Kiosk' )

	// } )
});
