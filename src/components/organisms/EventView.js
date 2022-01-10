// Data management
import { useState, useEffect } from 'react'
import { listenToCode, requestManualCodeRefresh, listenToEventMeta, refreshScannedCodesStatuses, trackEvent } from '../../modules/firebase'
import { log } from '../../modules/helpers'
import { useHistory, useParams } from 'react-router-dom'
import useInterval from 'use-interval'
const { REACT_APP_publicUrl } = process.env
log( 'Frontend using live url', REACT_APP_publicUrl )

// Components
import Section from '../atoms/Section'
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
  const { eventId, viewMode } = useParams()
  const { eventId: stateEventId } = history.location

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const defaultScanInerval = 2 * 60 * 1000
  const [ code, setCode ] = useState( null )
  const [ loading, setLoading ] = useState( 'Setting up your Kiosk' )
  const [ event, setEvent ] = useState(  )
	const [ internalEventId, setInternalEventId ] = useState( eventId || stateEventId )

  const [ scanInterval, setScanInterval ] = useState( defaultScanInerval )
  const [ acceptedTerms, setAcceptedTerms ] = useState( false )
  const [ mode, setMode ] = useState( viewMode )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Mode handling
  useEffect( ( ) => {

		log( `Url mode ${ viewMode }, state mode ${ mode }` )

		// If this is stream mode, hide the event Id from the URL
		if( mode == 'stream' ) {
			log( `Stream mode enabled for ${ eventId }, redirecting` )
			history.push( '/event/', {
				eventId
			} )
		}

  }, [ viewMode, mode ] )

  // Start code listener
  useEffect( f => {

    let cancelled = false

    log( `Listening to codes for ${ internalEventId }` )

    if( !internalEventId ) {
			alert( `Make sure to open this page through the link you received by email!` )
			return history.push( '/' )
    }

    const codeListener = listenToCode( internalEventId, newCode => {

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

  }, [ internalEventId ] )

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
  useEffect( () => {

		log( `New event ID ${ internalEventId } detected, grabbing event meta` )
		if( internalEventId ) return listenToEventMeta( internalEventId, setEvent )

  }, [ internalEventId ] )

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

  if( !mode ) return <Container>
    
		<Section>

			<H1 align="center">Are you online or IRL?</H1>
			<H2 align="center">Physical event mode</H2>
			<Text align="center">The physical event mode works best if you have one device that is dispensing POAPs. For example an iPad at the check-in of an event.</Text>
			<Button id="event-view-mode-physical" onClick={ f => setMode( 'physical' ) }>Use physical mode</Button>

		</Section>

		<Section>

			<H2>Online/stream mode</H2>
			<Text align="center">The streaming mode can be used as a screenshare in for example Discord. It is designed to handle many people scanning at the same time, and has extra farming protections.</Text>

			<Button id="event-view-mode-stream" onClick={ f => setMode( 'stream' ) }>Use streaming mode</Button>

		</Section>


    
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

    { event && <Sidenote>{ event.codes - event.codesAvailable } of { event.codes } codes claimed or pending</Sidenote> }

    <Network />

  </Container>

}
