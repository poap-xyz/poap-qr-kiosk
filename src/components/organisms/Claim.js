// Data management
import { useState, useEffect } from 'react'
import { log, dev, wait } from '../../modules/helpers'
import { useParams } from 'react-router-dom'
import { validateCallerDevice, trackEvent, listen_to_claim_challenge, get_code_by_challenge, requestManualCodeRefresh } from '../../modules/firebase'

// Components
import Loading from '../molecules/Loading'
import Stroop from '../molecules/Stroop'

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
  const [ poaplink, setPoaplink ] = useState(  )


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

  async function get_poap_link() {

    log( `Getting code for ${ challenge_code }: `, challenge )
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

    return link
  }

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////
  useEffect( (  ) => log( `✅ MOUNT` ), [] )
  useEffect( (  ) => log( `🚨RERENDER` ) )

  // Validate client as non bot
  useEffect( f => {

    let cancelled = false;

    // Validate client
    ( async () => {

      try {

        log( `Starting client validation` )

				// Backend marked this device as invalid
				if( challenge_code == 'robot' ) await stall_then_error()
        if( cancelled ) return

        // Validate device using appcheck
        const { data: isValid } = await validateCallerDevice()
        if( cancelled ) return

        // Always wait an extra second
        await wait( 2000 )
        if( cancelled ) return
        setLoading( `Prepping your POAP` )
        await wait( 2000 )
        if( cancelled ) return


        // if the challenge is invalid, stall and error
        if( !isValid || challenge?.expires < Date.now() ) return stall_then_error()

        // If the challenge is valid, continue
        if( cancelled ) return
        trackEvent( 'claim_device_validation_success' )
        setUserValid( true )

      } catch( e ) {

        log( e )
        trackEvent( 'claim_device_validation_failed' )
        alert( e.message )
        if( !cancelled ) setLoading( e.message )

      }

    } )()

    return () => cancelled = true

  }, [ challenge_code ] )

  // Once the user is validated, trigger the next step
  useEffect( (  ) => {

    let cancelled = false;

    ( async () => {

      try {

        // Check for presence of challenge data
        if( !userValid ) return log( `User not (yet) validated` )

        // Validate for expired challenge
        if( userValid && !challenge ) throw new Error( `This link was already used, please scan the QR again` )

        log( `Challenge received: `, challenge )

        // If this is a game challenge, end here
        if( challenge?.challenges?.includes( 'game' ) ) return log( 'Game challenge requested' )

        // If no game challenge, get a code
        const link = await get_poap_link()
        if( cancelled ) return

        if( !dev ) window.location.replace( link )
        else setLoading( `POAP link: ${ link }` )
        

      } catch( e ) {

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

    if( !gameDone ) return log( 'Game not done, not loading code' )
    let cancelled = false;

    ( async () => {

      try {

        // Game won? Get a code
        const link = await get_poap_link()
        if( cancelled ) return
        trackEvent( 'claim_device_game_won' )
        log( `Setting state link to `, link )
        setPoaplink( link )

      } catch( e ) {

        log( 'Error getting POAP: ', e )
        trackEvent( 'claim_device_validation_failed' )
        alert( e.message )
        if( !cancelled ) setLoading( e.message )

      }

    } )( )

    return () => cancelled = true

  }, [ gameDone ] )

  // Listen to challenge data
  useEffect( () => challenge_code && listen_to_claim_challenge( challenge_code, setChallenge ), [ challenge_code ] )

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////

  // If game challenge requested, show
  if( userValid && ( gameDone || challenge?.challenges?.includes( 'game' ) ) ) return <Stroop duration={ 30 } target_score={ 5 } onWin={ f => setGameDone( true ) } poap_url={ poaplink } />

  // loading screen is default
  return <Loading message={ loading } />


}
