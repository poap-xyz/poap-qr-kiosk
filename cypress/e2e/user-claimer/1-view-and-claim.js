/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )
const { get_claim_function_url, check_if_code_is_expected } = require( '../../support/e2e' )
const twoCodes = require( `../../fixtures/two-correct-codes${ Cypress.env( 'LOCAL' ) ? '' : '-ci' }` )
const fiveCodes = require( `../../fixtures/five-correct-codes${ Cypress.env( 'LOCAL' ) ? '' : '-ci' }` )
const request_options = {
    headers: {
        Host: new URL( Cypress.env( 'VITE_publicUrl' ) ).host
    },
    failOnStatusCode: false
}

async function extract_challenge_from_url ( response ) {

    cy.log( `Url from which to extract challenge: `, response )
    const { redirects } = response
    const [ challenge_url ] = redirects
    cy.log( `Redirect: `, challenge_url )
    const [ base, challenge_redirect ] = challenge_url.split( '/#/claim/' )
    const challenge = challenge_redirect.replace( '307: ' )
    cy.log( `Challenge extracted: ${ challenge }` )
    return challenge

}

context( 'Claimer can view valid events', () => {

    /* ///////////////////////////////
	// First event
	// /////////////////////////////*/

    it( 'Event 1: Creates event', function() {

        cy.create_kiosk( 'two' )

        // Save the event and admin links for further use
        cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_1_publiclink' ).then( f => cy.log( this.event_1_publiclink ) )
        cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

    } )

    it( 'Event 1: Can view event', function() {

        // Visit the public interface
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_1_public_auth_link' ).then( f => cy.log( `Event 1 public auth link: ${ this.event_1_public_auth_link }` ) )

    } )

    it( 'Event 1: Successfully redirects to challenge link', function( ) {


        // Visit the public link
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

                // Wait for code retreival
                cy.contains( 'POAP link' )

                // Check if POAP link supplies one of the test codes
                cy.get( '#loading_text' ).invoke( 'text' ).then( text => {
                    const [ base, code ] = text.split( '/claim/' )
                    expect( code ).to.satisfy( code => check_if_code_is_expected( code, twoCodes ) )
                } )

            } )
		

    } )

    it( 'Event 1: Shows code marked as used (previous redirect marked as used)', function( ) {

        // Visit the public link
        cy.visit( this.event_1_publiclink )


        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Shows one code as claimed
        cy.contains( '1 of 2 codes' )

    } )

    it( 'Event 1: Previous challenge link no longer works', function( ) {

        // Visit the public link
        cy.visit( this.event_1_first_challenge_url )

        // Interface should indicate that the link expired
        cy.contains( 'This link was already used' )

    } )

    it( 'Event 1: Shows no codes after both are scanned', function( ) {

        // Visit the public link to the second code as read by simulating a scan
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }` } ).as( `request` )
            .then( extract_challenge_from_url )
            .then( event_1_second_challenge => {

                // Visit the challenge link
                cy.visit( `/claim/${ event_1_second_challenge }` )

                // Wait for code retreival
                cy.contains( 'POAP link' )

                // Check if POAP link supplies one of the test codes
                cy.get( '#loading_text' ).invoke( 'text' ).then( text => {
                    const [ base, code ] = text.split( '/claim/' )
                    expect( code ).to.satisfy( coed => check_if_code_is_expected( code, twoCodes ) )
                } )

            } )

        // Visit public event link
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        cy.contains( '2 of 2 codes' )

    } )

    it( 'Event 1: Shows error if link was used after codes ran out', function( ) {

        // Visit the public link to the second code as read by simulating a scan
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_1_public_auth_link }` } ).as( `request` )
            .then( extract_challenge_from_url )
            .then( event_1_second_challenge => {

                // Visit the challenge link
                cy.visit( `/claim/${ event_1_second_challenge }` )

                // // Wait for code retreival
                cy.contains( 'No more POAP' )

            } )

    } )

    it( "Event 1: shows all codes available when admin requests code refresh", function() {

        // Check that confirmation and completion are communicated
        cy.on( 'window:confirm', response => {
            expect( response ).to.contain( 'Are you sure' )
        } )
        cy.on( 'window:alert', response => {
            expect( response ).to.contain( 'Recalculation succeeded' )
        } )

        // Open admin panel
        cy.visit( this.event_1_secretlink )

        // Click recalculation button
        cy.contains( 'Recalculate available codes' ).click()

        // Wait for recalculation to finish and the button to reappear
        cy.contains( 'Recalculate available codes' )

        // Visit public event link
        cy.visit( this.event_1_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Expect all codes to be available, note: the behaviour of a refresh causing all codes to be available is CI-only, in production it checks against the API
        cy.contains( '0 of 2 codes' )

    } )

    // /////////////////////////////
    // Second event
    // /////////////////////////////

    it( 'Event 2: Creates event', function() {

        cy.create_kiosk( 'five' )

        // Save the event and admin links for further use
        cy.get( 'input#admin-eventlink-public' ).invoke( 'val' ).as( 'event_2_publiclink' ).then( f => cy.log( this.event_2_publiclink ) )
        cy.get( 'input#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_2_secretlink' ).then( f => cy.log( this.event_2_secretlink ) )


    } )

    it( 'Event 2: Can view event', function() {

        // Visit the public interface
        cy.visit( this.event_2_publiclink )

        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Save the first public auth link shown
        cy.get( 'svg[data-code]' ).invoke( 'attr', 'data-code' ).as( 'event_2_public_auth_link' ).then( f => cy.log( `Event 2 public auth link: ${ this.event_2_public_auth_link }` ) )

    } )

	
    it( 'Event 2: Successfully redirects to challenge link', function( ) {


        // Visit the public link
        cy.request( { ...request_options, url: `${ get_claim_function_url(  ) }/${ this.event_2_public_auth_link }` } ).as( `request` )
            .then( extract_challenge_from_url )
            .then( event_2_first_challenge => {

                // Visit the challenge link
                cy.visit( `/claim/${ event_2_first_challenge }` )

                // Save challenge link
                cy.url().as( 'event_2_first_challenge_url' )

                // Check that backend redirected us to the claim page
                cy.url().should( 'include', '/#/claim' )

                // Expect the interface to check if we are human
                cy.contains( 'Verifying your humanity' )

                // Wait for code retreival
                cy.contains( 'POAP link' )

                // Check if POAP link supplies one of the test codes
                cy.get( '#loading_text' ).invoke( 'text' ).then( text => {
                    const [ base, code ] = text.split( '/claim/' )
                    expect( code ).to.satisfy( code => check_if_code_is_expected( code, fiveCodes ) )
                } )

            } )
		

    } )

    it( 'Event 2: Shows code marked as used (previous redirect marked as used)', function( ) {

        // Visit the public link
        cy.visit( this.event_2_publiclink )


        // Accept disclaimer
        cy.get( '#event-view-accept-disclaimer' ).click()

        // Shows one code as claimed
        cy.contains( '1 of 5 codes' )

    } )

    it( 'Event 2: Previous challenge link no longer works', function( ) {

        // Visit the public link
        cy.visit( this.event_2_first_challenge_url )

        // Interface should indicate that the link expired
        cy.contains( 'This link was already used' )

    } )

    it( 'Event 2: failed appcheck foreward to manual captcha', function( ) {

        cy.get_challenge_from_qr_public_auth( this.event_2_public_auth_link, `challenge_for_failed_appcheck` ).then( challenge_string => {

            // Visit the challenge link
            cy.visit( `/claim/${ challenge_string.replace( '?', `/force_failed_appcheck/?` ) }` )

            // Check that backend redirected us to the claim page
            cy.url().should( 'include', '/#/claim' )

            cy.contains( 'Verifying your humanity' )
            cy.contains( 'Have I seen you before' )
            cy.contains( 'Please check the box below to proceed' )

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

    it( 'Event 2: Deletes the event when clicked', function() {

        cy.visit( this.event_2_secretlink )

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