context( "POAP-app provided user_address is passed along to mint link", () => {

    it( 'Creates event', function() {

        cy.create_kiosk( 'five' )

        // Save the event and admin links for further use
        cy.get( 'span#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' ).then( f => cy.log( this.event_1_publiclink ) )
        cy.get( 'span#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

    } )

    it( 'Mocks QR scan to get the public auth link', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

    } )

    // NOTE: This is an old test, no longer needed now that we Mint POAPs within the kiosk
    // it( '?user_address provided by scan ends up in claim link', function( ) {


    //     // Mock the scanning of the QR code, but add a user address in the query string
    //     cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }?user_address=${ eth_address }` } ).as( `request` )
    //         .then( extract_challenge_from_url )
    //         .then( event_1_first_challenge => {

    //             // Visit the challenge link
    //             cy.visit( `/claim/${ event_1_first_challenge }` )

    //             // Check that backend redirected us to the claim page
    //             cy.url().should( 'include', '/#/claim' )

    //             // Check if POAP link supplies the expected user_address
    //             cy.contains( 'POAP link' ).invoke( 'text' ).then( text => {
    //                 expect( text ).to.satisfy( base => base.includes( eth_address ) )
    //             } )

    //         } )
		

    // } )

} )