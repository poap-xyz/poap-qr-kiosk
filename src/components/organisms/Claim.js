// Data management
import { useState, useEffect } from 'react'
import { log, dev } from '../../modules/helpers'
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

        const { data: isValid } = await validateCallerDevice()

        // If is valid, forward
        if( isValid ) {
          const link = `http://poap.xyz/claim/${ claimCode }`
          log( `Valid with code ${ claimCode }, forwarding to ${ link }` )
          trackEvent( 'claim_device_validation_failed' )
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
