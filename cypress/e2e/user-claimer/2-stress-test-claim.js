/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )

context( 'Claimer can view valid events', () => {

    const start = Date.now()

    /* ///////////////////////////////
	// Large event
	// /////////////////////////////*/

    it( 'Large event: Creates event', function() {

        cy.create_kiosk( 'five' )

        // Save the event and admin links for further use
        cy.get( 'span#admin-eventlink-public' ).invoke( 'val' ).as( 'publiclink' ).then( f => cy.log( this.publiclink ) )
        cy.get( 'span#admin-eventlink-secret' ).invoke( 'val' ).as( 'secretlink' ).then( f => cy.log( this.secretlink ) )


    } )

    it( 'Can view event', function() {

        // Visit the public interface
        cy.visit( this.publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'public_auth_link' ).then( f => cy.log( `Event public auth link: ${ this.public_auth_link }` ) )

    } )

	
    it( 'Successfully gets 3 challenge links', function( ) {


        // Scan in rapid succession
        cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_one`, start ).as( `challenge_one` )
        cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_two`, start ).as( `challenge_two` )
        cy.get_challenge_from_qr_public_auth( this.public_auth_link, `challenge_three`, start ).as( `challenge_three` )


    } )

    it( 'Successfully claims 3 challenge links', function( ) {

        // Scan and mint one by one
        cy.mint_poap_from_challenge( this.challenge_one, `challenge_one`, start )
            .then( () => cy.mint_poap_from_challenge( this.challenge_two, `challenge_two`, start ) )
            .then( () => cy.mint_poap_from_challenge( this.challenge_three, `challenge_three`, start ) )
    
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

        cy.on( 'window:alert', response => {
            expect( response ).to.contain( 'Deletion success' )
        } )
        cy.on( 'window:confirm', response => {
            expect( response ).to.contain( 'Are you sure' )
        } )

        cy.contains( 'Delete POAP Kiosk' ).click()
        cy.contains( 'Delete POAP Kiosk' )

        cy.url().should( 'eq', Cypress.config().baseUrl + '/' )
    } )

} )