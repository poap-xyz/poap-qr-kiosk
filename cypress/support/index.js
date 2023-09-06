// ***********************************************************
// This example support/index.js is processed and
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

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on( 'uncaught:exception', ( err, runnable ) => {

    Cypress.log( err )

    // returning false here prevents Cypress from
    // failing the test
    return false

} )

/* ///////////////////////////////
// CI video quality assurance
// Based on: https://www.cypress.io/blog/2021/03/01/generate-high-resolution-videos-and-screenshots/
// /////////////////////////////*/
// let's increase the browser window size when running headlessly
// this will produce higher resolution images and videos
// https://on.cypress.io/browser-launch-api
Cypress.on( 'before:browser:launch', ( browser = {}, launchOptions ) => {
    console.log(
        'launching browser %s is headless? %s',
        browser.name,
        browser.isHeadless,
    )

    // the browser width and height we want to get
    // our screenshots and videos will be of that resolution
    const width = 1920
    const height = 1080

    console.log( 'setting the browser window size to %d x %d', width, height )

    if( browser.name === 'chrome' && browser.isHeadless ) {
        launchOptions.args.push( `--window-size=${ width },${ height }` )

        // force screen to be non-retina and just use our given resolution
        launchOptions.args.push( '--force-device-scale-factor=1' )
    }

    if( browser.name === 'electron' && browser.isHeadless ) {
    // might not work on CI for some reason
        launchOptions.preferences.width = width
        launchOptions.preferences.height = height
    }

    if( browser.name === 'firefox' && browser.isHeadless ) {
        launchOptions.args.push( `--width=${ width }` )
        launchOptions.args.push( `--height=${ height }` )
    }

    // IMPORTANT: return the updated browser launch options
    return launchOptions
} )