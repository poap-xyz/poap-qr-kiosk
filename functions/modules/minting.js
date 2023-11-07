const { log } = require( './helpers' )

exports.mint_code_to_address = async ( { data } ) => {

    try {

        // Function dependencies
        const { sanetise_poap_id, sanetise_eth_or_ens_address } = require( '@poap/sane-data' )

        // Get the claim code and address to claim to from data property
        let { claim_code, challenge_code, address_to_mint_to } = data

        // Sanetise data
        claim_code = sanetise_poap_id( claim_code )
        address_to_mint_to = sanetise_eth_or_ens_address( address_to_mint_to )

        // Check if claim code is a mock code
        const is_mock = claim_code.includes( 'testing' )
        if( is_mock ) {
            log( `🤡 mocking the successful claiming of a code` )
            return { success: true }
        }

        /* ///////////////////////////////
        // Retryable mint link claim */
        let code_to_claim = claim_code
        let claim_success = false
        let claim_attempts = 0
        const max_claim_attempts = 3

        // Try to claim the code, retry on fails due to already being claimed
        while( !claim_success && claim_attempts < max_claim_attempts ) {

            log( `Attempting to claim code ${ code_to_claim } to address ${ address_to_mint_to }, attempt: ${ claim_attempts }` )

            // Get the claim secret of the mint link
            const { call_poap_endpoint } = require( './poap_api' )
            const { claimed, secret, error: preclaim_error, message: preclaim_error_message } = await call_poap_endpoint( `/actions/claim-qr`, { qr_hash: claim_code } )
            
            // Handle claim secret errors
            if( preclaim_error ) {
                log( `Error getting claim secret: `, preclaim_error )
                if( preclaim_error_message.includes( "Qr Claim not found" ) ) throw new Error( `Failed to get claim secret: Invalid claim link` )
                throw new Error( `Failed to get claim secret: ${ preclaim_error_message || preclaim_error }` )
            }

            // If POAP code was claimed, check for challenge validity and try another code
            if( claimed ) {

                // If no challenge code was provided, then this is probably a reuse of a link
                if( !challenge_code ) throw new Error( `We encountered an error minting this POAP, please scan again!` )

                // Validate that the challenge code matches the claim code provided
                const { db, dataFromSnap } = require( './firebase' )
                const { code, event_id } = await db.collection( 'code_issuances' ).doc( challenge_code ).get().then( dataFromSnap )
                if( code != claim_code ) throw new Error( `Failed to mint POAP: Invalid challenge` )

                // Get a new code for this event
                const { get_code_for_event } = require( './codes' )
                code_to_claim = await get_code_for_event( event_id )

                // Increment claim attempts and continue
                claim_attempts++
                continue

            }

            // Mint the POAP using the secret
            const { error, message } = await call_poap_endpoint( `/actions/claim-qr`, {
                secret,
                qr_hash: code_to_claim,
                address: address_to_mint_to
            }, 'POST', 'json', false )

            // If the POAP was successfully minted, return success
            if( !error ) {
                log( `Successfully minted POAP ${ code_to_claim } to address ${ address_to_mint_to }` )
                claim_success = true
                break
            }

            // Check if the error was due to already being claimed
            if( error && message.includes( 'already claimed' ) ) {
                claim_attempts++
                continue
            }

            if( error ) throw new Error( `Failed to mint POAP: ${ message }` )

        }

        // if claim was not successful, throw an error. This condition only happens on failing due to insufficient codes, other errors throw above this line
        if( !claim_success ) throw new Error( `The POAPs for this event seem to have run out!` )

        // Remove challenge code from code issuance list to prevent reuse
        const { db } = require( './firebase' )
        if( challenge_code ) await db.collection( 'code_issuances' ).doc( challenge_code ).delete()

        // Return success
        return { success: true }

    } catch ( e ) {
        log( `Error minting POAP: `, e )
        return { error: e.message }
    }

}