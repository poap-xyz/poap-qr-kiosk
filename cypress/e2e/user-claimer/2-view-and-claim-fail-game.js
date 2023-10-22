/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const { get_claim_function_url, request_options } = require( '../../support/e2e' )


async function extract_challenge_from_url ( response ) {

    const { redirects } = response
    const [ challenge_url ] = redirects
    cy.log( `Redirect: `, challenge_url )
    const [ base, challenge_redirect ] = challenge_url.split( '/#/claim/' )
    const challenge = challenge_redirect.replace( '307: ' )
    cy.log( `Challenge extracted: ${ challenge }` )
    return challenge

}

context( 'User can claim POAP after succeeding at challenge game', () => {

    /* ///////////////////////////////
	// First event
	// /////////////////////////////*/

    it( 'Event 1: Creates event', function() {

        cy.create_kiosk( 'one', 'game' )

        // Save the event and admin links for further use
        cy.get( 'span#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' ).then( f => cy.log( this.event_1_publiclink ) )
        cy.get( 'span#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

    } )

    it( 'Event 1: Can view event', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

    } )

    it( 'Event 1: Succesfully redirects to challenge link and fail at game', function( ) {

        // Visit the public link with games
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }` } ).as( `request` )
            .then( extract_challenge_from_url )
            .then( event_1_first_challenge => {

                // Visit the challenge link
                cy.visit( `/claim/${ event_1_first_challenge }` )

                // Save challenge link
                cy.url().as( 'event_1_first_challenge_url' )

                // Check that backend redirected us to the claim page
                cy.url().should( 'include', '/#/claim' )

                // Expect the interface to check if we are human
                cy.contains( 'Verifying your humanity' )
				
                // Human game welcome screen 
                cy.contains( 'Prove you are a human' )

                // Click start game button
                cy.contains( 'a', 'Start game' ).click()

                // Expect score text
                cy.contains( 'Score: 0 of' )

                // Expect winning screen
                cy.contains( 'Oh no' )

            } )
	
    } )

    it( 'Event 1: Shows code not marked as used after failing game', function( ) {

        // Visit the public link
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Shows one code as claimed
        cy.contains( '0 of 1 codes' )

    } )


    // Delete event 1
    it( 'Event 1: Deletes the event when clicked', function() {

        cy.visit( this.event_1_secretlink )

        cy.on( 'window:alert', response => {
            expect( response ).to.contain( 'Deletion success' )
        } )
        cy.on( 'window:confirm', response => {
            expect( response ).to.contain( 'Are you sure' )
        } )

        cy.contains( 'Delete POAP Kiosk' ).click()

        cy.url().should( 'eq', Cypress.config().baseUrl + '/' )
    } )

} )