const { log } = require( './helpers' )

exports.mint_code_to_address = async ( { data } ) => {

    try {

        // Function dependencies
        const { sanitise_string } = require( './validations' )

        // Get the claim code and address to claim to from data property
        let { claim_code, address_to_claim_to } = data

        // Sanetise data
        claim_code = sanitise_string( claim_code )
        address_to_claim_to = sanitise_string( address_to_claim_to )

        // Check if claim code is a mock code
        const is_mock = claim_code.includes( 'testing-' )
        if( is_mock ) {
            log( `🤡 mocking the successful claiming of a code` )
            return { success: true }
        }

        // Get the claim secret of the mint link
        const { call_poap_endpoint } = require( './poap_api' )
        const { claimed, secret } = await call_poap_endpoint( `/actions/claim-qr`, { qr_hash: claim_code } )
        if( claimed ) throw new Error( `This POAP has already been claimed, please scan again` )

        // Mint the POAP using the secret
        const { error } = await call_poap_endpoint( `/actions/claim-qr`, {
            secret,
            qr_hash: claim_code,
            address: address_to_claim_to
        }, 'POST', 'json', false )
        if( error ) throw new Error( `Failed to mint POAP: ${ error }` )

        // Return success
        return { success: true }

    } catch ( e ) {
        log( `Error minting POAP: `, e )
        return { error: e.message }
    }

}