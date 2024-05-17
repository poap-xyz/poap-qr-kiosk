import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { trackEvent } from '../../modules/firebase'
import { dev, log, wait } from '../../modules/helpers'



// Components
import { useChallenge } from '../../hooks/challenges'
import { useHealthCheck } from '../../hooks/health_check'
import { useValidateUser } from '../../hooks/user_validation'
import Captcha from '../molecules/Captcha'
import Loading from '../molecules/Loading'
import Stroop from '../molecules/Stroop'
import { useClaimcodeForChallenge } from '../../hooks/claim_codes'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ClaimPOAP() {

    // State handling
    const { challenge_code } = useParams( )
    const challenge = useChallenge( challenge_code )
    const [ captchaResponse, setCaptchaResponse ] = useState(  )
    const { message: user_validation_status_message, error: user_validation_error, user_valid } = useValidateUser( captchaResponse )

    // Challenge state management
    const has_game_challenge = challenge?.challenges?.includes( 'game' )

    // If this challenge includes a game, set the default gameDone to false (and the reverse too)
    const [ gameDone, setGameDone ] = useState()
    const should_fetch_poap_claim_code = gameDone || challenge && !has_game_challenge
    const { claim_link, error: error_getting_claim_code } = useClaimcodeForChallenge( captchaResponse, should_fetch_poap_claim_code )

    log( `Challenge ${ challenge_code }: `, challenge )
    log( `Has game: ${ has_game_challenge }, Game done: ${ gameDone }. User valid: ${ user_valid } (${ user_validation_status_message || 'no message' }). Claim link: ${ claim_link } (${ should_fetch_poap_claim_code ? 'should' : 'should not' } fetch)` )

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

    // ///////////////////////////////
    // Lifecycle handling
    // ///////////////////////////////

    // Health check
    useHealthCheck()

    // If the game is done, and the user is valid, redirect for claiming
    useEffect( (  ) => {

        log( `Determining whether to forward. User is ${ user_valid ? 'valid' : 'invalid' }, claim link is `, claim_link )

        // Game version do their claiming through a subcomponent of <Stroop />
        // for that reason we never forward game-based challenges
        if( has_game_challenge ) return

        // If user not yet verified, or link unavailable, exit
        if( !user_valid || !claim_link ) return

        // User verified, and link available, forward
        if( !dev ) window.location.replace( claim_link )

        // If we are in dev, wait for a few seconds so Cypress has time to check the link, and then forward
        if( dev ) wait( 2000 ).then( f => window.location.replace( claim_link ) )

    }, [ claim_link, user_valid, has_game_challenge ] )


    // ///////////////////////////////
    // Render component
    // ///////////////////////////////
    log( `Claim debug breadcrumbs: `, { user_valid, user_validation_status_message, captchaResponse, error_getting_claim_code, has_game_challenge, gameDone, claim_link } )

    // Auto validation failed, and there is a captcha response (meaning all validation options were exhausted)
    if( !user_valid && !user_validation_status_message && captchaResponse ) return <Loading message={ user_validation_status_message || user_validation_error || error_getting_claim_code } />

    // If there is a validation status use it
    if( user_validation_status_message ) return <Loading message={ user_validation_status_message } /> 

    // If user is not valid, and no captcha response is known, show captcha
    if( !user_valid && !captchaResponse ) return <Captcha onChange={ response => setCaptchaResponse( response ) } />

    // If the captcha was completed, but there is an error getting the claim code, show the error
    if( user_valid && error_getting_claim_code ) return <Loading message={ error_getting_claim_code } />

    // If game challenge requested, show
    // Note that the Stroop module also handles the showing of the "claim POAP" button and we do not rely on the other components in here
    if( user_valid && has_game_challenge ) return <Stroop duration_input={ challenge?.game_config?.duration } target_score_input={ challenge?.game_config?.target_score } onLose={ handleLose } onWin={ handleWin } poap_url={ claim_link  } />

    // In the CI, we display the successful claim flows using the loading component, this is so Cypress can check that we got the right code
    // note that the above useEffect forwards a user to the claim link when we are not in dev mode
    if( dev && user_valid && ( gameDone || !has_game_challenge ) && claim_link ) return <Loading message={ `POAP link: ${ claim_link }` } />

    // Default loading state, should only trigger while waiting for link that the user will be forwarded to
    return <Loading message="Loading your POAP..." />

}
