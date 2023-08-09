import { useEffect, useState } from "react"
import { log, wait } from "../modules/helpers"
import { trackEvent, validateCallerCaptcha, validateCallerDevice } from "../modules/firebase"
import { useParams } from "react-router-dom"
import { useChallenge } from "./challenges"
import { useTranslation } from "react-i18next"

export const useValidateUser = ( captchaResponse ) => {

    // i18next hook
    const { t } = useTranslation()

    // States
    const { challenge_code, error_code } = useParams(  )
    const [ message, set_message ] = useState( `${ t( 'claim.setLoading' ) }` )
    const [ user_valid, set_user_valid ] = useState( true )
    const challenge = useChallenge( challenge_code )

    // Stakking function 
    async function stall( trail, step_delay=5000, error=true ) {

        // Mark user as invalid
        set_user_valid( false )

        log( `Stalling for ${ trail } with ${ step_delay }, end in ${ error ? 'error' : 'continue' }` )

        trackEvent( 'claim_spammer_stall_triggered' )
        // Wait to keep the spammer busy
        await wait( step_delay )
        set_message( `${ t( 'claim.stall.loadingPrimary' ) }` )
        await wait( step_delay )
        set_message( `${ t( 'claim.stall.loadingSecondary' ) }` )
        await wait( step_delay )
        set_message( `${ t( 'claim.stall.loadingNewScan' ) }` )
        if( error ) throw new Error( `${ t( 'claim.stall.loadingError', {  error_code: error_code, challenge_code: challenge_code, trail: trail } ) }` )
    
        // Turn off the message so that the frontend sees both user_valid=false and no message (which triggers manual captcha)
        set_message( false )

    }

    // Validate client as non bot
    // Note: in the past we deliberately slowed the users down in this process to prevent farmers of the "multiple tabs open at the same time" kind.
    // As a business decision this was decided against, so I made it a toggle
    const slow_users_down = false
    useEffect( f => {

        let cancelled = false;

        // Validate client
        ( async () => {

            try {

                log( `🕵️ Starting client validation` )
                if( slow_users_down ) await wait( 1000 )

                /* ///////////////////////////////
                // Failure mode 1: Backend marked this device as invalid */
                if( challenge_code == 'robot' ) await stall( 'ch_c robot', 2000, false )
                if( cancelled ) return

                // Validate device using appcheck
                log( `🕵️ Validating caller device` )
                let { data: isValid } = await validateCallerDevice()
                log( `🕵️ Caller validated: `, isValid )
                if( cancelled ) return

                // Allow for a manual triggering of invalid device
                if( error_code == 'force_failed_appcheck' ) {
                    log( `Simulating failed appcheck through force_failed_appcheck parameter` )
                    isValid = false
                }

                // Always wait an extra second
                await wait( slow_users_down ? 2000 : 1000 )
                if( cancelled ) return
                set_message( `${ t( 'claim.preppingMessage' ) }` )
                if( slow_users_down ) await wait( 2000 )
                if( cancelled ) return


                /* ///////////////////////////////
                 // Failure mode 2: challenge link is invalid */
        
                // if the challenge is invalid, stall and error
                if( challenge?.expires < Date.now() ) return stall( `${ isValid ? 'v' : 'iv' }_expired` )

                /* ///////////////////////////////
                // Failure mode 3: Invalid captcha 3, no captcha 2 data yet */

                if( !isValid && !captchaResponse ) return stall( `Stall before captcha`, 3000, false )

                /* ///////////////////////////////
                // Failure mode 4: fallback captcha is not valid */

                // Check local captcha response with backend
                if( !isValid && captchaResponse ) {

                    log( `🕵️ Starting manual captcha validation` )
                    const { data: captchaIsValid } = await validateCallerCaptcha( captchaResponse )
                    log( `🕵️ Manual captcha validation: `, captchaIsValid )

                    // If captcha is invalid, trigger fail
                    if( !captchaIsValid ) {
                        trackEvent( 'claim_device_captcha_fail' )
                        await stall( `cfail` )
                    } else {
                        trackEvent( 'claim_device_captcha_success' )
                    }

                }

                /* ///////////////////////////////
                // Success mode: nothing failed */

                // If the challenge is valid, continue
                trackEvent( 'claim_device_validation_success' )
                set_user_valid( true )
                set_message( undefined )

            } catch ( e ) {

                log( e )
                trackEvent( 'claim_device_validation_failed' )
                if( !cancelled ) set_message( e.message )

            }

        } )()

        return () => cancelled = true

    }, [ challenge_code, captchaResponse ] )

    return { message, user_valid }

}