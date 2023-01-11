const random_code = `testing-${ Math.random() }`
const random_email = `${ Math.random() }@email.com`
const invalid_code = `a_code_is_never_longer_than_6_characters-${ Math.random() }`

context( "User can view and claim through static QR url", () => {



    it( 'Can view test code', () => {

        // Visit code claim page
        cy.visit( `/static/claim/${ random_code }` )

        // Page renders
        cy.contains( `Collect your POAP` )

    } )

    it( 'Can claim test code', () => {

        // Visit code claim page
        cy.visit( `/static/claim/${ random_code }` )

        // Fill in email
        cy.get( '#static-print-qr-email-field' ).type( random_email )

        // Click checkbox
        cy.contains( 'I accept' ).click()

        // Claim POAP
        cy.get( 'a#static-print-qr-claim-button' ).click()
        cy.contains( `Collecting your POAP` )

        // Claim succeeded
        cy.contains( `successfully collected` )

    } )


} )


context( "User can view and claim through static QR url", () => {


    it( 'Fails when trying to claim the same code twice', () => {

        // Visit code claim page
        cy.visit( `/static/claim/${ random_code }` )

        // Should say the code expired
        cy.contains( `already used` )

    } )

    it( 'Fails when visiting malformed link', () => {

        // Visit code claim page
        cy.visit( `/static/claim/${ invalid_code }` )

        // Should say the code expired
        cy.contains( `invalid link` )

    } )

} )