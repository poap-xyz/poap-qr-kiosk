import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { trackEvent } from '../../modules/firebase'
import { dev, log } from '../../modules/helpers'



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
export default function ViewQR( ) {

    // State handling
    const { challenge_code } = useParams( )
    const challenge = useChallenge( challenge_code )
    const [ captchaResponse, setCaptchaResponse ] = useState(  )
    const { message: user_validation_status_message, user_valid } = useValidateUser( captchaResponse )

    // Game state management]
    const has_game_challenge = challenge?.challenges?.includes( 'game' )

    // If this challenge includes a game, set the default gameDone to false (and the reverse too)
    const [ gameDone, setGameDone ] = useState()
    const { claim_link, error } = useClaimcodeForChallenge( captchaResponse )

    log( `Challenge ${ challenge_code }: `, challenge )
    log( `Has game: ${ has_game_challenge }, Game done: ${ gameDone }. User valid: ${ user_valid } (${ user_validation_status_message || 'no message' }) .Claim link: ${ claim_link }` )

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
        if( !user_valid || !gameDone || !claim_link ) return
        if( !dev ) window.location.replace( claim_link )
    }, [ claim_link, user_valid, gameDone ] )


    // ///////////////////////////////
    // Render component
    // ///////////////////////////////

    // If there is a validation status use it
    if( user_validation_status_message || error ) return <Loading message={ user_validation_status_message || error } />

    // If user is not valid, and no captcha response is known, show captcha
    if( !user_valid && !captchaResponse ) return <Captcha onChange={ response => setCaptchaResponse( response ) } />

    // If game challenge requested, show
    // Note that the Stroop module also handles the showing of the "claim POAP" button and we do not rely on the other components in here
    if( user_valid && has_game_challenge ) return <Stroop duration_input={ challenge?.game_config?.duration } target_score_input={ challenge?.game_config?.target_score } onLose={ handleLose } onWin={ handleWin } poap_url={ claim_link  } />

    // In the CI, we display the successful claim flows using the loading component, this is so Cypress can check that we got the right code
    // note that the above useEffect forwards a user to the claim link when we are not in dev mode
    if( dev && user_valid && ( gameDone || !has_game_challenge ) && claim_link ) return <Loading message={ `POAP link: ${ claim_link }` } />

    // Default loading state
    return <Loading message="Loading..." />

}
