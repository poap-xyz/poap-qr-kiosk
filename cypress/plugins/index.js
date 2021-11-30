/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars

// Load environment variables
let envFile = '.env.production'

// If in offline dev, use development env
if( process.env.NODE_ENV == 'development' ) envFile = '.env.development'

// If in CI use .env since the workflows write to that file on run
if( process.env.CI ) envFile = '.env'

const dotenvConfig = {
    path: `${ __dirname }/../../${ envFile }`
  }
console.log( `Runing cypress with ${ process.env.NODE_ENV } and ${ envFile }` )
require('dotenv').config( dotenvConfig )

module.exports = (on, config) => {

  config.env.REACT_APP_publicUrl = process.env.REACT_APP_publicUrl
  return config
  
}