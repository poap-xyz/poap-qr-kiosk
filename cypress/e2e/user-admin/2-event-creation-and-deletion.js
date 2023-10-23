/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )

context( 'Organiser successful event creation', () => {

    it( 'Shows only file box if no file was selected', () => {

        cy.visit( '/create?debug=true' )

        cy.get( '#event-create-file' ).should( 'exist' )
        cy.contains( 'label', 'Select .txt file that' )
        
    } )

    it( 'Shows prefilled fields after file selected', () => {

        cy.visit( '/create?debug=true' )

        // Select file
        const codes = require( `../../fixtures/two-correct-codes${ Cypress.env( 'LOCAL' ) ? '-ci' : '' }.js` )
        const uniquified_codes_as_string = codes.map( code => `${ code }-${ Date.now() }` ).join( '\n' )
        cy.contains( 'label', 'Select .txt file that' )
        cy.get( '#event-create-file' ).selectFile( {
            contents: Cypress.Buffer.from( uniquified_codes_as_string ),
            fileName: 'mintlinks.csv',
            mimeType: 'text/csv',
            lastModified: Date.now(),
        }, { force: true } )
        cy.contains( 'Checking your mint links' )

        // Relevant inputs appear
        cy.contains( 'label', 'Kiosk title' )
        cy.contains( 'label', 'Your email' )
        cy.contains( 'label', 'Kiosk expiry date' )

        // Inputs are prefilled with expected values (generated based on backend testing defaults)
        cy.get( 'input#event-create-name' ).should( input => {
            const val = input.val()
            expect( val ).to.include( 'Test Event' )
        } )
			
        // const tomorrow = new Date( Date.now() + 1000 * 60 * 60 * 24 )
        // let month = tomorrow.getUTCMonth() + 1
        // month = `${ month }`.length == 1 ? `0${ month }` : month
        // let day = tomorrow.getDate()
        // day = `${ day }`.length == 1 ? `0${ day }` : day
        // const YMD = `${ tomorrow.getFullYear() }-${ month }-${ day }`
        // cy.get( 'input#event-create-date' ).should( 'have.value', YMD )

        const tomorrow = new Date( Date.now() + 1000 * 60 * 60 * 24 )
        tomorrow.setUTCHours( 0, 0, 0, 0 ) // Set time to midnight UTC
        const month = ( tomorrow.getUTCMonth() + 1 ).toString().padStart( 2, '0' )
        const day = tomorrow.getUTCDate().toString().padStart( 2, '0' )
        const expectedDate = `${ tomorrow.getUTCFullYear() }-${ month }-${ day }`
        
        cy.get( 'input#event-create-date' )
            .invoke( 'val' )
            .should( 'eq', expectedDate )

        cy.contains( 'Create Kiosk' )

    } )

    it( 'Shows hidden fields after specific click amount', () => {

        cy.visit( '/create?debug=true' )

        // Select file
        const codes = require( `../../fixtures/two-correct-codes${ Cypress.env( 'LOCAL' ) ? '-ci' : '' }.js` )
        const uniquified_codes_as_string = codes.map( code => `${ code }-${ Date.now() }` ).join( '\n' )
        cy.contains( 'label', 'Select .txt file that' )
        cy.get( '#event-create-file' ).selectFile( {
            contents: Cypress.Buffer.from( uniquified_codes_as_string ),
            fileName: 'mintlinks.csv',
            mimeType: 'text/csv',
            lastModified: Date.now(),
        }, { force: true } )
        cy.contains( 'Checking your mint links' )

        // Relevant inputs appear
        cy.contains( 'label', 'Kiosk title' )
        cy.contains( 'label', 'Your email' )
        cy.contains( 'label', 'Kiosk expiry date' )

        // Click the body 20x to show hidden fields
        for( let i = 0; i < 20; i++ ) {
            cy.get( 'body' ).click()
        }

        // Relevant hidden inputs appear
        cy.contains( 'label', 'Abuse protection level' )
        cy.contains( 'label', 'Custom CSS overrides' )
        cy.contains( 'label', 'Collect emails?' )

        // Inputs are prefilled with expected values (generated based on backend testing defaults)
        cy.get( 'input#event-create-name' ).should( input => {
            const val = input.val()
            expect( val ).to.include( 'Test Event' )
        } )

        const tomorrow = new Date( Date.now() + 1000 * 60 * 60 * 24 )
        const month = ( tomorrow.getUTCMonth() + 1 ).toString().padStart( 2, '0' )
        const day = tomorrow.getUTCDate().toString().padStart( 2, '0' )
        const expectedDate = `${ tomorrow.getUTCFullYear() }-${ month }-${ day }`
        
        cy.get( 'input#event-create-date' )
            .invoke( 'val' )
            .then( ( inputDate ) => {
                const inputDateObject = new Date( inputDate )
                const expectedDateObject = new Date( expectedDate )
                expect( inputDateObject ).to.be.at.least( expectedDateObject )
            } )
        cy.contains( 'Create Kiosk' )

    } )

    it( 'Fails with missing data and succeeds when all data is provided', function() {

        let alerts = 0
        cy.on( 'window:alert', response => {
            alerts++
            if( alerts == 1 ) expect( response ).to.contain( 'specify an event name' )
            if( alerts == 2 ) expect( response ).to.contain( 'specify a valid email address' )
            if( alerts == 3 ) expect( response ).to.contain( 'specify the date' )
        } )

        cy.visit( '/create?debug=true' )

        // Select file
        const codes = require( `../../fixtures/two-correct-codes${ Cypress.env( 'LOCAL' ) ? '-ci' : '' }.js` )
        const uniquified_codes_as_string = codes.map( code => `${ code }-${ Date.now() }` ).join( '\n' )
        cy.contains( 'label', 'Select .txt file that' )
        cy.get( '#event-create-file' ).selectFile( {
            contents: Cypress.Buffer.from( uniquified_codes_as_string ),
            fileName: 'mintlinks.csv',
            mimeType: 'text/csv',
            lastModified: Date.now(),
        }, { force: true } )

        // Clear inputs
        cy.get( '#event-create-name' ).clear()
        cy.get( '#event-create-date' ).clear()
        cy.get( '#event-create-email' ).clear()

        // Run through failures
        cy.get( '#event-create-submit' ).click()
        cy.get( '#event-create-name' ).type( admin.events[0].name )

        cy.get( '#event-create-submit' ).click()
        cy.get( '#event-create-email' ).type( admin.email )

        cy.get( '#event-create-submit' ).click()
        cy.get( '#event-create-date' ).type( admin.events[0].end )

        // Successfully create
        cy.get( '#event-create-submit' ).click()

        cy.contains( 'Creating POAP Kiosk' )
        cy.url().should( 'include', '/event/admin' )

        cy.contains( 'Admin panel for' )
        cy.contains( 'Admin link:' )

        // Save the event and admin links for further use
        cy.get( '#admin-eventlink-secret' ).invoke( 'val' ).as( 'event_1_secretlink' ).then( f => cy.log( this.event_1_secretlink ) )

    } )

    it( 'Deletes the event when clicked', function() {

        cy.visit( this.event_1_secretlink )

        cy.get( '#deleteEvent' ).click()

        cy.contains( 'Delete Kiosk' )

        cy.get( '#safelyDeleteButton' ).click()

        cy.contains( 'Deletion success!' )

        cy.url().should( 'eq', Cypress.config().baseUrl + '/' )

        cy.wait( 2000 )
    } )

} )