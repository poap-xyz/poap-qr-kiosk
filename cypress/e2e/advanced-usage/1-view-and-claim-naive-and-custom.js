/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const { eth_address, custom_base_url } = require( '../../fixtures/mock-data' )
const { get_claim_function_url, extract_challenge_from_url } = require( '../../support/e2e' )
const request_options = {
    headers: {
        Host: new URL( Cypress.env( 'VITE_publicUrl' ) ).host
    },
    failOnStatusCode: false
}
async function extract_redirect_url ( response ) {

    cy.log( `Url from which to extract challenge: `, response )
    const { redirects } = response
    const [ redirect_url ] = redirects
    cy.log( `Redirect: `, redirect_url )
    return redirect_url

}
context( 'Claimer can view valid events', () => {

    /* ///////////////////////////////
	// First event
	// /////////////////////////////*/

    it( 'Creates event with custom base url and css', function() {

        cy.create_kiosk( 'two', 'naive' )

        // Save the event and admin links for further use
        cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' ).then( f => cy.log( this.event_1_publiclink ) )
        cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

    } )

    it( 'Event loads custom css', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )
        
        // Check that the custom css was loaded
        cy.get( "style#custom-added-css-overrides" )

        // This is custom css set in ../support/commands.js
        cy.get( 'body' ).should( 'have.css', 'opacity', '0.99' )

    } )

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

                // This is a custom url set in ../support/commands.js
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

} )