// Data management
import { useState, useEffect } from 'react'
import { log, dev, wait } from '../../modules/helpers'
import { useParams } from 'react-router-dom'
import { validateCallerDevice, trackEvent, listen_to_claim_challenge, get_code_by_challenge, requestManualCodeRefresh } from '../../modules/firebase'

// Components
import Loading from '../molecules/Loading'
// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const { challenge_code } = useParams( )
  const [ loading, setLoading ] = useState( `Verifying your humanity, you'll be forwarded soon` )
  const [ userValid, setUserValid ] = useState( false )
  const [ gameDone, setGameDone ] = useState( false )
  const [ challenge, setChallenge ] = useState( {} )

  /* ///////////////////////////////
  // Component functions
  // /////////////////////////////*/
  async function stall_then_error() {

    trackEvent( 'claim_spammer_stall_triggered' )
    // Wait to keep the spammer busy
    await wait( 5000 )
    setLoading( '👀 Have I seen you before?' )
    await wait( 5000 )
    setLoading( '🧐 You look a bit suspicious my friend...' )
    await wait( 5000 )
    setLoading( 'Please scan a new QR code' )
    throw new Error( `Verification failed! Either you took too long, or a lot of people are scanning at the same time, please scan again :)` )

  }

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Validate client as non bot
  useEffect( f => {

    let cancelled = false;

    // Validate client
    ( async () => {

      try {

				// Backend marked this device as invalid
				if( challenge_code == 'robot' ) await stall_then_error()

        // Validate device using appcheck
        const { data: isValid } = await validateCallerDevice()

        // Always wait an extra second
        await wait( 2000 )
        setLoading( `Prepping your POAP` )
        await wait( 2000 )

        // If is valid and not yet expired, continue
        if( isValid && !( challenge?.expires < Date.now() ) ) {
          setUserValid( true )
          trackEvent( 'claim_device_validation_success' )
          setLoading( false )
        }
        else await stall_then_error()

        // If game challenge was requested but not completed, end here
        if( challenge?.challenges?.includes( 'game' ) && !gameDone ) return log( `Device valid, but game not completed` )

        // If no game challenge or it was completed, get a code
        log( `Getting code for ${ challenge_code }` )
        let { data: claim_code } = await get_code_by_challenge( challenge_code )

        // On first fail, refresh codes and try again
        if( claim_code.error ) {
          const { data } = await requestManualCodeRefresh().catch( e => ( { data: e } ) )
          log( `Remote code update response : `, data )
          const { data: retried_claim_code } = await get_code_by_challenge( challenge_code )
          claim_code = retried_claim_code
        }

        // Handle code errors
        if( claim_code.error ) throw new Error( claim_code.error )
        log( `Received code: `, claim_code )

        // Formulate redirect 
        const link = `https://poap.xyz/claim/${ claim_code }`
        log( `Claim link generated: `, link )

        if( !dev ) window.location.replace( link )
        else setLoading( `POAP link: ${ link }` )

      } catch( e ) {

        log( e )
        trackEvent( 'claim_device_validation_failed' )
        alert( e.message )
        if( !cancelled ) setLoading( e.message )

      }

    } )()

    return () => cancelled = true

  }, [ challenge_code, gameDone ] )

  // Listen to challenge data
  useEffect( () => challenge_code && listen_to_claim_challenge( challenge_code, setChallenge ), [ challenge_code ] )

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////

  // If game challenge requested, show
  // if( challenge?.challenges?.includes( 'game' ) ) return <GAME />!!!!!!!!!!!!!!

  // loading screen is default
  return <Loading message={ loading } />


}
