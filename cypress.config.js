const { defineConfig } = require( 'cypress' )

// Video recording sizing
const browser_width = 1920
const browser_height = 1080
const viewport_width = 1024
const viewport_height = 1024*1.5

module.exports = defineConfig( {

    // General options
    defaultCommandTimeout: process.env.NODE_ENV == 'development' ? 60000 : 60000,
    requestTimeout: process.env.NODE_ENV == 'development' ? 60000 : 60000,
    watchForFileChanges: false,

    // Video recording options
    video: true,
    videoUploadOnPasses: false,
    videoCompression: false,
    screenscreenshotOnRunFailureshots: true,
    chromeWebSecurity: false,

    // Browser viewport sizing
    viewportWidth: viewport_width,
    viewportHeight: viewport_height,

    // Retries
    retries: {
        runMode: 1,
        openMode: 1
    },

    // E2e conifg
    e2e: {
		
        // Experimental flag that restores the old "run all" button, may have bugs
        experimentalRunAllSpecs: true,

        setupNodeEvents( on, config ) {

            console.log( `Setting up Cypress` )


            // Cypress preprocessing
            const webpackPreprocessor = require( '@cypress/webpack-preprocessor' )
            on( 'file:preprocessor', webpackPreprocessor( {} ) )

            /* ///////////////////////////////
            // Browser configuration
            // /////////////////////////////*/
            on( 'before:browser:launch', ( browser = {}, launchOptions ) => {

                const { name, family, isHeadless } = browser

                /* ///////////////////////////////
                // Open devtools */
                if( family === 'chromium' && name !== 'electron' ) launchOptions.args.push( '--auto-open-devtools-for-tabs' )  
                if( family === 'firefox' ) launchOptions.args.push( '-devtools' )
                if( name === 'electron' ) launchOptions.preferences.devTools = true


                /* ///////////////////////////////
                // Browser sizing */

                console.log(
                    'launching browser %s is headless? %s',
                    name,
                    isHeadless
                )

                if( !isHeadless ) return launchOptions

                console.log( 'setting the browser window size to %d x %d', browser_width, browser_height )

                if( name === 'chrome' ) {
                    launchOptions.args.push( `--window-size=${ browser_width },${ browser_height }` )

                    // force screen to be non-retina and just use our given resolution
                    launchOptions.args.push( '--force-device-scale-factor=1' )
                }

                if( name === 'electron' ) {
                    // might not work on CI for some reason
                    launchOptions.preferences.width = browser_width
                    launchOptions.preferences.height = browser_height
                }

                if( name === 'firefox' ) {
                    launchOptions.args.push( `--width=${ browser_width }` )
                    launchOptions.args.push( `--height=${ browser_height }` )
                }

                return launchOptions
                
            } )

            // Config failfast module
            require( "cypress-fail-fast/plugin" )( on, config )

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

            // Set up environment variables in cypress tests
            require( 'dotenv' ).config( dotenvConfig )

            // Environment variables to pass to cypress because we need them in tests
            const env_to_pass = [ 'VITE_projectId', 'VITE_useEmulator', 'VITE_publicUrl' ]
            env_to_pass.map( key => {
                if( process.env[ key ] ) config.env[ key ] = process.env[ key ]
                else console.log( `Missing ${ key } in env` )
            } )

            // Setting up sorry cypress
            const { cloudPlugin } = require( "cypress-cloud/plugin" )

            return cloudPlugin( on, config )
		

        },
        specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
        baseUrl: "http://localhost:3000/#",

    }

} )