const { defineConfig } = require( 'cypress' )
module.exports = defineConfig( {

    defaultCommandTimeout: process.env.NODE_ENV == 'development' ? 20000 : 60000,
    requestTimeout: 60000,
    video: true,
    videoCompression: false,
    screenscreenshotOnRunFailureshots: true,
    chromeWebSecurity: false,
    watchForFileChanges: false,

    e2e: {

        // Experimental flag that restores the old "run all" button, may have bugs
        experimentalRunAllSpecs: true,

        setupNodeEvents( on, config ) {

            // Load environment variables
            let envFile = '.env.production'

            // If in offline dev, use development env
            if( process.env.NODE_ENV == 'development' ) envFile = '.env.development'

            // If in CI use .env since the workflows write to that file on run
            if( process.env.CI ) envFile = '.env'

            const dotenvConfig = {
                path: `${ __dirname }/${ envFile }`
            }
            console.log( `Runing cypress with ${ process.env.NODE_ENV } and ${ envFile }` )

            require( 'dotenv' ).config( dotenvConfig )

            console.log( `Environment: `, process.env )

            // Environment variables to pass to cypress because we need them in tests
            const env_to_pass = [ 'REACT_APP_projectId', 'REACT_APP_useEmulator', 'REACT_APP_publicUrl' ]
            env_to_pass.map( key => config.env[ key] = process.env[ key] )

            return config


        },
        specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
        baseUrl: "http://localhost:3000/#",

    }

} )
