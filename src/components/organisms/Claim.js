// Data management
import { useState, useEffect } from 'react'
import { listenToCode, markCodeClaimed, event, requestManualCodeRefresh } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'
import { useHistory, useParams } from 'react-router-dom'
import { validateCallerDevice } from '../../modules/firebase'

// Components
import QRCode from 'react-qr-code'
import Loading from '../molecules/Loading'
import Button from '../atoms/Button'
import Container from '../atoms/Container'
import { Sidenote } from '../atoms/Text'

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
          if( !dev ) window.location.replace( link )
        }
        else throw new Error( `Device is not valid, contact the POAP team` )

      } catch( e ) {

        log( e )
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
