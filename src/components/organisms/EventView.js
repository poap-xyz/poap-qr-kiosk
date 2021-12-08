// Data management
import { useState, useEffect } from 'react'
import { listenToCode, requestManualCodeRefresh, listenToEventMeta, refreshScannedCodesStatuses, trackEvent } from '../../modules/firebase'
import { log } from '../../modules/helpers'
import { useHistory, useParams } from 'react-router-dom'
import useInterval from 'use-interval'
const { REACT_APP_publicUrl } = process.env
log( 'Frontend using live url', REACT_APP_publicUrl )

// Components
import QR from '../atoms/QR'
import Button from '../atoms/Button'
import Loading from '../molecules/Loading'
import { H1, H2, Text, Sidenote } from '../atoms/Text'
import Container from '../atoms/Container'
import Network from '../molecules/NetworkStatusBar'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

  const history = useHistory()
  const { eventId } = useParams()

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const defaultScanInerval = 2 * 60 * 1000
  const [ code, setCode ] = useState( null )
  const [ loading, setLoading ] = useState( 'Setting up your Kiosk' )
  const [ event, setEvent ] = useState(  )
  const [ scanInterval, setScanInterval ] = useState( defaultScanInerval )
  const [ acceptedTerms, setAcceptedTerms ] = useState( false )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Start code listener
  useEffect( f => {

    let cancelled = false

    log( `Listening to codes for ${ eventId }` )

    const codeListener = listenToCode( eventId, newCode => {

      // Set new code to state
      if( !cancelled ) {
        setCode( newCode.id )
        trackEvent( 'qr_view_code_loaded' )
      }
      if( !cancelled && newCode.id ) setLoading( false )

    } )

    return () => {
      cancelled = true
      return codeListener
    }

  }, [] )

  // No code? Manual refresh timer
  useEffect( f => {

    let cancelled = false

    // If there is a code, do nothing
    if( code?.length ) return


    // If there is no code, after a delay take away the loading indicator
    const maxWaitForFirstCode = 5000
    const timeout = setTimeout( f => {

      // Ask backend to update all old codes
      trackEvent( 'qr_view_force_backend_refresh' )
      requestManualCodeRefresh().then( res => {
        log( `Backend refresh complete with `, res )
        if( !cancelled ) setLoading( false )
      } )

    }, maxWaitForFirstCode )
    log( `New timeout ${ timeout } set` )

    // Give useEffect a cancel funtion
    return f => {
      cancelled = true
      log( `Code changed to ${ code }, cancel previous refresh `, timeout )
      clearTimeout( timeout )
    }

  }, [ code ] )

  // Get event details on load
  useEffect( () => listenToEventMeta( eventId, setEvent ), [] )

  // Update the state of scanned codes periodically
  useInterval( () => {

      // let cancelled = false;
      
      ( async () => {

        try {

          log( 'Starting remote scanned code scan' )
          const { data: { error, updated } } = await refreshScannedCodesStatuses()
          log( `${ updated } scanned codes updated with error: `, error )

        } catch( e ) {
          log( `Scanned code update error: `, e )
        }

      } )()

      // return () => cancelled = true

  }, scanInterval )


  // ///////////////////////////////
  // Render component
  // ///////////////////////////////

  // Show welcome screen
  if( !acceptedTerms ) return <Container>
    
    <H1 align="center">Before we begin</H1>
    <H2 align="center">Scan QRs with a camera app</H2>
    <Text align="center">Do not scan codes with the POAP app, they will not work. This is an anti-abuse measure.</Text>

    <H2>Keep your internet on</H2>
    <Text align="center">Without an internet connection new codes will stop loading. You will receive a notification if the dispenser notices you are offline.</Text>

    <Button id="event-view-accept-disclaimer" onClick={ f => setAcceptedTerms( true ) }>I understand, let&apos;s go!</Button>

  </Container>

  // loading screen
  if( loading ) return <Loading message={ loading } />

  // Expired event error
  if( event?.expires && event.expires < Date.now() ) return <Container>
  
    <h1>QR Kiosk expired</h1>
    <Sidenote>This kiosk was set to expire on { new Date( event.expires ).toString(  ) } by the organiser.</Sidenote>
    
  </Container>

  // No code error
  if( !code ) return <Container>
  
    <h1>No codes available</h1>
    <Sidenote onClick={ f => history.push( '/admin' ) }>If you just uploaded new ones, give the backend a minute to catch up. If nothing happens for a while, click here to open the admin interface.</Sidenote>
    
  </Container>
  
  // Display QR
  return <Container>

    {  /* Event metadata */ }
    { event && <H1 align="center">{ event.name }</H1> }
    { <H2 align="center">Scan the QR with your camera to claim your POAP</H2> }

    {  /* QR showing code */ }
    <QR key={ code } className='glow' data-code={ code } value={ `${ REACT_APP_publicUrl }/claim/${ code }` } />
    { /* <Button onClick={ nextCode }>Next code</Button> */ }

    { event && <Sidenote>{ event.codes - event.codesAvailable } of { event.codes } codes claimed</Sidenote> }

    <Network />

  </Container>

}
