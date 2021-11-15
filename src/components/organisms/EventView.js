// Data management
import { useState, useEffect } from 'react'
import { listenToCode, markCodeClaimed, event, requestManualCodeRefresh } from '../../modules/firebase'
import { log } from '../../modules/helpers'
import { useHistory, useParams } from 'react-router-dom'

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

  const history = useHistory()
  const { eventId } = useParams()

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const [ code, setCode ] = useState( null )
  const [ loading, setLoading ] = useState( true )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Start code listener
  useEffect( f => {
    log( `Litening to codes for ${ eventId }` )
    return listenToCode( eventId, newCode => {
      setCode( newCode.id )
      if( newCode.id ) setLoading( false )
    } )
  }, [] )

  // No code timeout
  useEffect( f => {

    // If there is a code, do nothing
    if( code?.length ) return


    // If there is no code, after a delay take away the loading indicator
    const maxWaitForFirstCode = 5000
    const timeout = setTimeout( f => {

      // Ask backend to update all old codes
      requestManualCodeRefresh().then( res => {
        log( `Backend refresh complete with `, res )
        setLoading( false )
      } )

    }, maxWaitForFirstCode )
    log( `New timeout ${ timeout } set` )

    // Give useEffect a cancel funtion
    return f => {
      log( `Code changed to ${ code }, cancel previous refresh `, timeout )
      clearTimeout( timeout )
    }

  }, [ code ] )

  // ///////////////////////////////
  // Component functions
  // ///////////////////////////////
  // async function nextCode(  ) {
  //   log( `Marking ${ code } as claimed` )
  //   setLoading( 'Getting next code' )
  //   await markCodeClaimed( code )
  //   event( 'user_request_next_qr' )
  // }

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////

  // loading screen
  if( loading ) return <Loading message={ loading } />

  // No code error
  if( !code ) return <Container>
  
    <h1>No codes available</h1>
    <Sidenote onClick={ f => history.push( '/admin' ) }>If you just uploaded new ones, give the backend a minute to catch up. If nothing happens for a while, click here to open the admin interface.</Sidenote>
    
  </Container>
  
  // Display QR
  return <Container>

    {  /* QR showing code in base64 for minor obfuscation */ }
    <QRCode data-code={ code } value={ `https://poap-qr-kiosk.web.app/claim/${ code }` } />
    { /* <Button onClick={ nextCode }>Next code</Button> */ }
  </Container>

}
