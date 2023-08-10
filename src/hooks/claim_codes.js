import { useParams } from "react-router-dom"
import { dev, log } from "../modules/helpers"
import { get_code_by_challenge, requestManualCodeRefresh, trackEvent } from "../modules/firebase"
import { useChallenge } from "./challenges"
import { useEffect, useState } from "react"
import { useValidateUser } from "./user_validation"
import { useEventOfChallenge } from "./events"
import { useTranslation } from "react-i18next"
const { REACT_APP_publicUrl } = process.env

export const useClaimcodeForChallenge = ( captchaResponse, fetch_code=false ) => {

    // i18next hook
    const { t } = useTranslation()

    // Get challenge code from url
    const { challenge_code } = useParams(  )
    const challenge = useChallenge( challenge_code )
    const { user_valid } = useValidateUser( captchaResponse )
    const [ claim_link, set_claim_link ] = useState(  )
    const [ error, set_error ] = useState(  )
    const event = useEventOfChallenge( challenge_code )

    // Get claim code
    async function get_poap_link() {


        log( `Getting code for ${ challenge_code }: `, challenge )
        let { data: claim_code } = await get_code_by_challenge( { challenge_code, captcha_response: captchaResponse } )

        // On first fail, refresh codes and try again
        if( claim_code.error ) {
            const { data } = await requestManualCodeRefresh( challenge?.eventId ).catch( e => ( { data: e } ) )
            log( `Remote code update response : `, data )
            const { data: retried_claim_code } = await get_code_by_challenge( { challenge_code, captcha_response: captchaResponse } )
            claim_code = retried_claim_code
        }

        // Handle code errors
        if( claim_code.error ) throw new Error( claim_code.error )
        log( `Received code: `, claim_code )
        trackEvent( `claim_code_received` )

        // Formulate redirect depending on claim type
        let link = `https://poap.xyz/claim/${ claim_code }`
        if( event?.collect_emails ) link = `${ REACT_APP_publicUrl }/#/static/claim/${ claim_code }`
        if( event?.claim_base_url ) link = `${ event?.claim_base_url }${ claim_code }`
        log( `${ t( 'claim.formulateRedirect' ) }`, link )

        return link
    }

    // Once the user is validated, get a POAP claim code
    useEffect( (  ) => {

        log( `claim_codes.js triggered with User valid: ${ user_valid }, fetch code: ${ fetch_code }` )

        let cancelled = false;

        ( async () => {

            try {

                // Check for presence of challenge data
                if( !user_valid ) return log( 'User not (yet) validated' )

                // Validate for expired challenge
                if( user_valid && challenge?.deleted ) {
                    trackEvent( `claim_challenge_expired` )
                    throw new Error( `${ t( 'claim.validation.alreadyUsed' ) }` )
                }

                log( `Challenge received: `, challenge )


                // If we already have a link in the state, do not get a new one
                if( claim_link ) return

                // If we are not ready to fetch the code ret, return undefined
                if( !fetch_code ) return

                // If no game challenge, get a code
                const link = await get_poap_link()
                if( cancelled ) return

                set_claim_link( link )

            } catch ( e ) {

                log( `Error getting challenge: `, e )

                // Setting error to loading screen ( CI relies on this )
                set_error( e.message )

            }

        } )( )

        return () => cancelled = true

    }, [ user_valid, fetch_code ] )

    return { claim_link, error }

}