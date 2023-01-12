// Data management
import { useState, useEffect } from 'react'
import { log, dev, wait } from '../../modules/helpers'
import { useParams } from 'react-router-dom'
import { validateCallerDevice, validateCallerCaptcha, trackEvent, listen_to_claim_challenge, get_code_by_challenge, requestManualCodeRefresh, health_check } from '../../modules/firebase'

import { useTranslation } from 'react-i18next'

// Components
import Loading from '../molecules/Loading'
import Stroop from '../molecules/Stroop'
import Captcha from '../molecules/Captcha'
import { useEventOfChallenge } from '../../hooks/events'
const { REACT_APP_publicUrl } = process.env

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

    // useTranslation loads the first namespace (example 1) by default and pre caches the second variable, the t hook still needs a reference like example 2.
    // Example 1: Translations for this organism are loaded by i18next like: t( 'key.reference' )
    // Example 2: Translations for sitewide texts are in Namespace 'dispenser' and are loaded like: t( 'key.reference', { ns: 'dispenser' } )
    const { t } = useTranslation( [ 'dynamic' , 'dispenser' ] )

    // ///////////////////////////////
    // State handling
    // ///////////////////////////////
    const { challenge_code, error_code } = useParams( )
    const [ loading, setLoading ] = useState( `${ t( 'claim.setLoading' ) }` )
    const [ userValid, setUserValid ] = useState( false )
    const [ gameDone, setGameDone ] = useState( false )
    const [ challenge, setChallenge ] = useState( {} )
    const [ poaplink, setPoaplink ] = useState(  )
    const [ captchaResponse, setCaptchaResponse ] = useState(  )
    const event = useEventOfChallenge( challenge_code )


    /* ///////////////////////////////
  // Component functions
  // /////////////////////////////*/
    function handleWin( score ) {
        setGameDone( true )
        trackEvent( `claim_game_won_with_${ score }` )
    }
    function handleLose( score ) {
        setGameDone( false )
        trackEvent( `claim_game_lost_with_${ score }` )
    }

    async function stall( trail, step_delay=5000, error=true ) {

        log( `Stalling for ${ trail } with ${ step_delay }, end in ${ error ? 'error' : 'continue' }` )

        trackEvent( 'claim_spammer_stall_triggered' )
        // Wait to keep the spammer busy
        await wait( step_delay )
        setLoading( `${ t( 'claim.stall.loadingPrimary' ) }` )
        await wait( step_delay )
        setLoading( `${ t( 'claim.stall.loadingSecondary' ) }` )
        await wait( step_delay )
        setLoading( `${ t( 'claim.stall.loadingNewScan' ) }` )
        if ( error ) throw new Error( `${ t( 'claim.stall.loadingError', {  error_code: error_code, challenge_code: challenge_code, trail: trail } ) }` )
    
        setLoading( false )

    }

    async function get_poap_link() {

        log( `Getting code for ${ challenge_code }: `, challenge )
        let { data: claim_code } = await get_code_by_challenge( { challenge_code, captcha_response: captchaResponse } )

        // On first fail, refresh codes and try again
        if ( claim_code.error ) {
            const { data } = await requestManualCodeRefresh().catch( e => ( { data: e } ) )
            log( `Remote code update response : `, data )
            const { data: retried_claim_code } = await get_code_by_challenge( { challenge_code, captcha_response: captchaResponse } )
            claim_code = retried_claim_code
        }

        // Handle code errors
        if ( claim_code.error ) throw new Error( claim_code.error )
        log( `Received code: `, claim_code )
        trackEvent( `claim_code_received` )

        // Formulate redirect depending on claim type
        let link = `https://poap.xyz/claim/${ claim_code }`
        if ( event?.collect_emails ) link = `${ REACT_APP_publicUrl }/#/static/claim/${ claim_code }`
        if ( event?.claim_base_url ) link = `${ event?.claim_base_url }${ claim_code }`
        log( `${ t( 'claim.formulateRedirect' ) }`, link )

        return link
    }

    // ///////////////////////////////
    // Lifecycle handling
    // ///////////////////////////////

    // Health check
    useEffect( (  ) => {

        let cancelled = false;

        ( async () => {

            try {

                const { data: health } = await health_check()
                log( `Systems health: `, health )
                if ( cancelled ) return log( `Health effect cancelled` )
                if ( !dev && !health.healthy ) {
                    trackEvent( `claim_system_down` )
                    return alert( `${ t( 'health.maintenance', { ns: 'dispenser' } ) }` )
                }

            } catch ( e ) {
                log( `Error getting system health: `, e )
            }

        } )( )

        return () => cancelled = true

    }, [] )

    // Validate client as non bot
    useEffect( f => {

        let cancelled = false;

        // Validate client
        ( async () => {

            try {

                log( `Starting client validation` )
                await wait( 1000 )

                /* ///////////////////////////////
        // Failure mode 1: Backend marked this device as invalid */
                if ( challenge_code == 'robot' ) await stall( 'ch_c robot', 2000, false )
                if ( cancelled ) return

                // Validate device using appcheck
                let { data: isValid } = await validateCallerDevice()
                if ( cancelled ) return

                // Allow for a manual triggering of invalid device
                if ( error_code == 'force_failed_appcheck' ) {
                    log( `Simulating failed appcheck through force_failed_appcheck parameter` )
                    isValid = false
                }

                // Always wait an extra second
                await wait( 2000 )
                if ( cancelled ) return
                setLoading( `${ t( 'claim.preppingMessage' ) }` )
                await wait( 2000 )
                if ( cancelled ) return


                /* ///////////////////////////////
        // Failure mode 2: challenge link is invalid */
        
                // if the challenge is invalid, stall and error
                if ( challenge?.expires < Date.now() ) return stall( `${ isValid ? 'v' : 'iv' }_expired` )

                /* ///////////////////////////////
        // Failure mode 3: Invalid captcha 3, no captcha 2 data yet */

                if ( !isValid && !captchaResponse ) return stall( `Stall before captcha`, 3000, false )

                /* ///////////////////////////////
        // Failure mode 4: fallback captcha is not valid */

                // Check local captcha response with backend
                if ( !isValid && captchaResponse ) {

                    const { data: captchaIsValid } = await validateCallerCaptcha( captchaResponse )

                    // If captcha is invalid, trigger fail
                    if ( !captchaIsValid ) {
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
                setUserValid( true )

            } catch ( e ) {

                log( e )
                trackEvent( 'claim_device_validation_failed' )
                alert( e.message )
                if ( !cancelled ) setLoading( e.message )

            }

        } )()

        return () => cancelled = true

    }, [ challenge_code, captchaResponse ] )

    // Once the user is validated, trigger the next step
    useEffect( (  ) => {

        let cancelled = false;

        ( async () => {

            try {

                // Check for presence of challenge data
                if ( !userValid ) return log( 'User not (yet) validated' )

                // Validate for expired challenge
                if ( userValid && !challenge ) {
                    trackEvent( `claim_challenge_expired` )
                    throw new Error( `${ t( 'claim.validation.alreadyUsed' ) }` )
                }

                log( `Challenge received: `, challenge )

                // If this is a game challenge, end here
                if ( challenge?.challenges?.includes( 'game' ) ) return log( 'Game challenge requested' )

                // If no game challenge, get a code
                const link = await get_poap_link()
                if ( cancelled ) return

                if ( !dev ) window.location.replace( link )
                else setLoading( `POAP link: ${ link }` )
        

            } catch ( e ) {

                alert( e.message )
                log( `Error getting challenge: `, e )

                // Setting error to loading screen ( CI relies on this )
                setLoading( e.message )

            }

        } )( )

        return () => cancelled = true

    }, [ userValid ] )

    // POAP getting for the game
    useEffect( (  ) => {

        if ( !gameDone ) return log( 'Game not done, not loading code' )
        let cancelled = false;

        ( async () => {

            try {

                // Game won? Get a code
                const link = await get_poap_link()
                if ( cancelled ) return
                trackEvent( 'claim_device_game_won' )
                log( `Setting state link to `, link )
                setPoaplink( link )

            } catch ( e ) {

                log( 'Error getting POAP: ', e )
                trackEvent( 'claim_poap_fetch_failed' )
                alert( e.message )
                if ( !cancelled ) setLoading( e.message )

            }

        } )( )

        return () => cancelled = true

    }, [ gameDone ] )

    // Listen to challenge data
    useEffect( () => challenge_code && listen_to_claim_challenge( challenge_code, setChallenge ), [ challenge_code ] )

    // ///////////////////////////////
    // Render component
    // ///////////////////////////////

    // If user is not valid, and no captcha response is known, show captcha
    if ( !userValid && !captchaResponse && !loading ) return <Captcha onChange={ response => setCaptchaResponse( response ) } />

    // If game challenge requested, show
    if ( userValid && ( gameDone || challenge?.challenges?.includes( 'game' ) ) ) return <Stroop duration_input={ challenge?.game_config?.duration } target_score_input={ challenge?.game_config?.target_score } onLose={ handleLose } onWin={ handleWin } poap_url={ poaplink } />

    // loading screen is default
    return <Loading message={ loading } />


}
