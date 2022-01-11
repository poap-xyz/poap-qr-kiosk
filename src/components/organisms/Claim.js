// Data management
import { useState, useEffect } from 'react'
import { log, dev, wait } from '../../modules/helpers'
import { useParams } from 'react-router-dom'
import { validateCallerDevice, trackEvent } from '../../modules/firebase'

// Components
import Loading from '../molecules/Loading'
// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const { claimCode } = useParams( )
  const [ loading, setLoading ] = useState( `Verifying your humanity, you'll be forwarded soon` )

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
				if( claimCode == 'robot' ) {

					// Wait to keep the spammer busy
					await wait( 5000 )
					setLoading( '👀 Have I seen you before?' )
					await wait( 5000 )
					setLoading( '🧐 You look a bit suspicious my friend...' )
					await wait( 5000 )
					setLoading( 'Please scan a new QR code' )
					throw new Error( `You were marked as a robot! This can happen if a lot of people are scanning at the same time, please scan again :)` )

				}

        const { data: isValid } = await validateCallerDevice()

        // If is valid, forward
        if( isValid ) {
          const link = `http://poap.xyz/claim/${ claimCode }`
          log( `Valid with code ${ claimCode }, forwarding to ${ link }` )
          trackEvent( 'claim_device_validation_success' )
          if( !dev ) window.location.replace( link )
        }
        else throw new Error( `Device is not valid, contact the POAP team` )

      } catch( e ) {

        log( e )
        trackEvent( 'claim_device_validation_failed' )
        alert( e.message )
        if( !cancelled ) setLoading( e.message )

      }

    } )()

    return () => cancelled = true

  }, [ claimCode ] )

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////

  // loading screen
  if( loading ) return <Loading message={ loading } />

}
