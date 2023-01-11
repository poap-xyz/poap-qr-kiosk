/* ///////////////////////////////
// Event creation page
// /////////////////////////////*/

const admin = require( '../../fixtures/admin-user' )

context( 'Organiser successful event creation', () => {

    it( 'Shows only file box if no file was selected', () => {

        cy.visit( '/create?debug=true' )
        cy.get( 'a' ).should( 'not.exist' )
        cy.contains( 'label', 'Select .txt file that' )

    } )

    it( 'Shows prefilled fields after file selected', () => {

        cy.visit( '/create?debug=true' )

        // Select file
        cy.contains( 'label', 'Select .txt file that' )
        cy.get( 'input[type=file]' ).attachFile( Cypress.env( 'LOCAL' ) ? `two-correct-codes.txt` : `two-correct-codes-ci.txt` )
        cy.contains( 'Checking your mint links' )

        // Relevant inputs appear
        cy.contains( 'label', 'Drop name' )
        cy.contains( 'label', 'Your email' )
        cy.contains( 'label', 'POAP Kiosk expiry date' )

        // Inputs are prefilled with expected values (generated based on backend testing defaults)
        cy.get( 'input#event-create-name' ).should( input => {
            const val = input.val()
            expect( val ).to.include( 'Test Event' )
        } )
			
        const tomorrow = new Date( Date.now() + 1000 * 60 * 60 * 24 )
        let month = tomorrow.getUTCMonth() + 1
        month = `${ month }`.length == 1 ? `0${ month }` : month
        let day = tomorrow.getDate()
        day = `${ day }`.length == 1 ? `0${ day }` : day
        const YMD = `${ tomorrow.getFullYear() }-${ month }-${ day }`
        cy.get( 'input#event-create-date' ).should( 'have.value', YMD )

        cy.contains( 'Create dispenser with 2 codes' )
		

    } )

    it( 'Fails with missing data and succeeds when all data is provided', () => {

        let alerts = 0
        cy.on( 'window:alert', response => {
            alerts++
            if ( alerts == 1 ) expect( response ).to.contain( 'specify an event name' )
            if ( alerts == 2 ) expect( response ).to.contain( 'specify a valid email address' )
            if ( alerts == 3 ) expect( response ).to.contain( 'specify the date' )
        } )

        // Clear inputs
        cy.get( '#event-create-name' ).clear()
        cy.get( '#event-create-date' ).clear()
        cy.get( '#event-create-email' ).clear()

        cy.get( '#event-create-submit' ).click()
        cy.get( '#event-create-name' ).type( admin.events[0].name )

        cy.get( '#event-create-submit' ).click()
        cy.get( '#event-create-email' ).type( admin.email )

        cy.get( '#event-create-submit' ).click()
        cy.get( '#event-create-date' ).type( admin.events[0].end )

        cy.get( '#event-create-submit' ).click()

        cy.contains( 'Creating POAP Kiosk' )
        cy.url().should( 'include', '/event/admin' )

        cy.contains( 'Your public POAP Kiosk link' )
        cy.contains( 'Your secret admin link' )

    } )

    it( 'Deletes the event when clicked', () => {

        cy.on( 'window:alert', response => {
            expect( response ).to.contain( 'Deletion success' )
        } )
        cy.on( 'window:confirm', response => {
            expect( response ).to.contain( 'Are you sure' )
        } )

        cy.contains( 'Delete POAP Kiosk' ).click()
        cy.contains( 'Delete POAP Kiosk' )

        cy.url().should( 'eq', Cypress.config().baseUrl + '/' )

        // Wait for firestore to delete old codes
        cy.wait( 2000 )

    } )

} )