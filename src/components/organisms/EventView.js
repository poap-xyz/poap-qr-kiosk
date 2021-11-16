// Data management
import { useState, useEffect } from 'react'
import { listenToCode, requestManualCodeRefresh, listenToEventMeta } from '../../modules/firebase'
import { log } from '../../modules/helpers'
import { useHistory, useParams } from 'react-router-dom'

// Components
import QR from '../atoms/QR'
import Loading from '../molecules/Loading'
import { H1, H2, Sidenote } from '../atoms/Text'
import Container from '../atoms/Container'

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
  const [ loading, setLoading ] = useState( 'Setting up your Kiosk' )
  const [ event, setEvent ] = useState(  )

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

  // Get event details on load
  useEffect( () => listenToEventMeta( eventId, setEvent ), [] )


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

    {  /* Event metadata */ }
    { event && <H1>{ event.name }</H1> }
    { <H2 align="center">Scan the code below to claim your POAP</H2> }

    {  /* QR showing code */ }
    <QR data-code={ code } value={ `https://poap-qr-kiosk.web.app/claim/${ code }` } />
    { /* <Button onClick={ nextCode }>Next code</Button> */ }

    { event && <Sidenote>{ event.codes - event.codesAvailable } of { event.codes } codes claimed</Sidenote> }

  </Container>

}
