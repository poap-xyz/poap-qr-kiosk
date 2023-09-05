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

// Get the url of functions, to be used to call emulator or live url
export const get_claim_function_url = () => {

    cy.log( `Generating link based on: `, JSON.parse( JSON.stringify( Cypress.env() ) ) )

    const functions_emulator_port = 5001
    const { REACT_APP_projectId, REACT_APP_useEmulator, REACT_APP_publicUrl } = Cypress.env()

    let url = ''
    if( REACT_APP_useEmulator !== 'true' ) url = `${ REACT_APP_publicUrl }/claim`
    else url = `http://localhost:${ functions_emulator_port }/${ REACT_APP_projectId }/us-central1/claimMiddleware/claim`
    cy.log( `Generated functions URL: ${ url }` )
    return url

}

// Alternatively you can use CommonJS syntax:
// require('./commands')