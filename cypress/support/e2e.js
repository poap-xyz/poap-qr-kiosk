// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Request configuration for in-cypress reqyests
export const request_options = {
    headers: {
        Host: new URL( Cypress.env( 'VITE_publicUrl' ) ).host
    },
    failOnStatusCode: false
}

// Get the url of functions, to be used to call emulator or live url
export const get_claim_function_url = () => {

    cy.log( `Generating link based on: `, JSON.stringify( Cypress.env() ) )

    const functions_emulator_port = 5001
    const { VITE_projectId, VITE_useEmulator, VITE_publicUrl } = Cypress.env()

    let url = ''
    if( VITE_useEmulator !== 'true' ) url = `${ VITE_publicUrl }/claim`
    else url = `http://localhost:${ functions_emulator_port }/${ VITE_projectId }/us-central1/claimMiddleware/claim`
    cy.log( `Generated functions URL: ${ url }` )
    return url

}

// Helper function to see if a code matches any of the codes in an array of expected codes
export const check_if_code_is_expected = ( code_to_check, expected_codes ) => {

    cy.log( `Checking if code ${ code_to_check } is in`, JSON.stringify( expected_codes ) )
    const code_is_expected = expected_codes.some( expected_code => {
        // The expected codes are literal codes like testing1, the code is a literal code plus a random string
        // so for example we are checking if testing1-498743798.includes( testing1 )
        const matches = code_to_check.includes( expected_code )
        if( matches ) cy.log( `Code ${ code_to_check } is in ${ expected_code }` )
        return matches
    } )

    if( !code_is_expected ) cy.log( `Code ${ code_to_check } is not in ${ expected_codes }` )
    return code_is_expected

}

export async function extract_redirect_url ( response ) {

    cy.log( `Response object from which to extract challenge (can be printed to browser console): `, response )
    const { redirects } = response

    // If there are no redirects, something weird happens that we need to debug
    if( !redirects?.length ) {
        cy.log( `No redirects found, full response body (status ${ response.status }): `, response.body )
        cy.log( `There were ${ response?.allRequestResponses?.length } responses to the request:` )
        response?.allRequestResponses?.forEach( unique_res => {
            cy.log( `Status ${ unique_res[ 'Response Status' ] } from ${ unique_res[ 'Request URL' ] }`, unique_res[ 'Response Body' ] )
        } )
        return null
    }

    const [ redirect_url ] = redirects
    cy.log( `Redirect: `, redirect_url )
    return redirect_url

}

export async function extract_challenge_from_url ( response ) {

    const challenge_url = await extract_redirect_url( response )
    const [ base, challenge_redirect ] = challenge_url.split( '/#/claim/' )
    const challenge = challenge_redirect.replace( '307: ' )
    cy.log( `Challenge extracted: ${ challenge }` )
    return challenge

}

