/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const { get_claim_function_url } = require( '../../support/e2e' )
const request_options = {
    headers: {
        Host: new URL( Cypress.env( 'VITE_publicUrl' ) ).host
    },
    failOnStatusCode: false
}
async function extract_challenge_url ( response ) {

    cy.log( `Url from which to extract challenge: `, response )
    const { redirects } = response
    const [ challenge_url ] = redirects
    cy.log( `Redirect: `, challenge_url )
    return challenge_url

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

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

    } )

    it( 'Event loads POAP with custom base url', function( ) {


        // Visit the public link
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }` } ).as( `request` )
            .then( extract_challenge_url )
            .then( challenge_url => {

                // This is a custom url set in ../support/commands.js
                expect( challenge_url ).to.contain( 'https://kiosk.poap.xyz/#/404/' )

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