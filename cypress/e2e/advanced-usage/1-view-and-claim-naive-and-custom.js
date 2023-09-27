/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const { eth_address, custom_base_url } = require( '../../fixtures/mock-data' )
const { get_claim_function_url, extract_challenge_from_url, extract_redirect_url } = require( '../../support/e2e' )
const request_options = {
    headers: {
        Host: new URL( Cypress.env( 'VITE_publicUrl' ) ).host
    },
    failOnStatusCode: false
}

context( 'Advanced functionality works', () => {

    it( 'Creates naive event with custom base url and css', function() {

        cy.create_kiosk( 'two', 'naive' )

        // Save the event and admin links for further use
        cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' ).then( f => cy.log( this.event_1_publiclink ) )
        cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

    } )

    /* ///////////////////////////////
    // iframe mode
    // /////////////////////////////*/
    it( "Event loads iframe mode according to spec", function() {

        // Spec parameters
        const iframe_qr_size = 256

        // Visit the public interface
        cy.visit( `${ this.event_1_publiclink }/iframe` )

        // Check that the url is correct
        cy.url().should( 'include', 'event/cached/iframe' )

        // Check that the disclaimer is not present
        cy.get( '#event-view-accept-disclaimer' ).should( 'not.exist' )

        // Check that the svg is the right size
        cy.get( "#iframe-mode-qr" ).invoke( 'attr', 'width' ).should( 'eq', `${ iframe_qr_size }` )
        cy.get( "#iframe-mode-qr" ).invoke( 'attr', 'height' ).should( 'eq', `${ iframe_qr_size }` )

        // Check that the svg is aligned exactly with the top left of the dom
        cy.get( "#iframe-mode-qr" ).should( $el => {

            // Get element coordinates
            const rect = $el[0].getBoundingClientRect()

            // Check that the element is at the top left of the dom
            expect( rect.top ).to.eq( 0 )
            expect( rect.left ).to.eq( 0 )

            // Check that bottom right corner is exactly where expected
            expect( rect.bottom ).to.eq( iframe_qr_size )
            expect( rect.right ).to.eq( iframe_qr_size )

        } )


    } )

    /* ///////////////////////////////
    // Custom css
    // /////////////////////////////*/
    it( 'Event loads custom css', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )
        
        // Check that the custom css was loaded
        cy.get( "style#custom-added-css-overrides" )

        // This is custom css set in ../support/commands.js
        cy.get( 'body' ).should( 'have.css', 'opacity', '0.99' )

    } )

    it( 'Event loads custom css when in iframe mode', function() {

        // Visit the public interface
        cy.visit( `${ this.event_1_publiclink }/iframe` )

        // Check that the url is correct
        cy.url().should( 'include', 'event/cached/iframe' )
        
        // Check that the custom css was loaded
        cy.get( "style#custom-added-css-overrides" )

        // This is custom css set in ../support/commands.js
        cy.get( 'body' ).should( 'have.css', 'opacity', '0.99' )

    } )

    /* ///////////////////////////////
    // Custom base urls
    // /////////////////////////////*/
    it( 'Mocks qr scan to get public auth link', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

    } )

    it( 'Event loads POAP with custom base url', function( ) {


        // Visit the public link
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }` } ).as( `request` )
            .then( extract_redirect_url )
            .then( redirect_url => {

                expect( redirect_url ).to.contain( custom_base_url )

            } )
		

    } )

    it( 'Mocks qr rescan to get public auth link', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )
        
        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

    } )

    /* ///////////////////////////////
    // Passing user addresses with naive custom base
    // /////////////////////////////*/
    it( '?user_address provided by scan ends up in claim link', function( ) {


        // Mock the scanning of the QR code, but add a user address in the query string
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }?user_address=${ eth_address }` } ).as( `request` )
            .then( extract_redirect_url )
            .then( redirect_url => {
                    
                // Check that both the custom base url and the user address are present
                expect( redirect_url ).to.contain( custom_base_url )
                expect( redirect_url ).to.contain( eth_address )

            } )

    } )

    it( 'Event 1: Deletes the event when clicked', function() {

        cy.visit( this.event_1_secretlink )

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

    /* ///////////////////////////////
    // Address passing in non-naive custom base mode
    // /////////////////////////////*/
    it( 'Creates event', function() {

        cy.create_kiosk( 'five', 'custombase' )

        // Save the event and admin links for further use
        cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' ).then( f => cy.log( this.event_1_publiclink ) )
        cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

    } )

    it( 'Mocks QR scan to get the public auth link', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

    } )

    it( '?user_address provided by scan ends up in claim link', function( ) {


        // Mock the scanning of the QR code, but add a user address in the query string
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }?user_address=${ eth_address }` } ).as( `request` )
            .then( extract_challenge_from_url )
            .then( challenge => {


                // Visit the challenge link
                cy.visit( `/claim/${ challenge }` )

                // Check that backend redirected us to the claim page
                cy.url().should( 'include', '/#/claim' )

                // Check if POAP link supplies the expected user_address and base url
                cy.contains( 'POAP link' ).invoke( 'text' ).then( text => {
                    cy.log( `POAP link: `, text )
                    expect( text ).to.satisfy( base => base.includes( eth_address ) )
                    expect( text ).to.satisfy( base => base.includes( custom_base_url ) )
                } )
            

            } )
		

    } )



} )