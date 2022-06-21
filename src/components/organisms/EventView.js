// Data management
import { useState, useEffect } from 'react'
import { requestManualCodeRefresh, listenToEventMeta, refreshScannedCodesStatuses, trackEvent, health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useInterval from 'use-interval'

// Debugging data
let { REACT_APP_publicUrl, REACT_APP_useEmulator } = process.env
const emulatorUrl = 'http://localhost:5001/'
if( REACT_APP_useEmulator ) REACT_APP_publicUrl = emulatorUrl
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

  const navigate = useNavigate()
  const location = useLocation()

  // Event ID form url
  const { eventId, viewMode } = useParams()

  // Event ID from pushed state
  const { eventId: stateEventId } = location

  const force_appcheck_fail = window?.location?.href?.includes( 'FORCE_INVALID_APPCHECK' )

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const defaultScanInerval = 2 * 60 * 1000
  const [ loading, setLoading ] = useState( 'Setting up your Kiosk' )
  const [ event, setEvent ] = useState(  )
  const [ template, setTemplate ] = useState( {} )
	const [ internalEventId, setInternalEventId ] = useState( eventId || stateEventId )
  const [ scanInterval, setScanInterval ] = useState( defaultScanInerval )
  const [ acceptedTerms, setAcceptedTerms ] = useState( viewMode == 'silent' )
  const [ iframeMode, setIframeMode ] = useState( false )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Mode handling
  useEffect( f => {

    if( !viewMode ) return
    if( viewMode == 'silent' ) setAcceptedTerms( true )
    if( viewMode == 'iframe' ) setIframeMode( true )

  }, [ viewMode  ] )

  // Health check
  useEffect( (  ) => {

    let cancelled = false;

    ( async () => {

      try {

        const { data: health } = await health_check()
        log( `Systems health: `, health )
        if( cancelled ) return log( `Health effect cancelled` )
        if( !dev && !health.healthy ) {
          trackEvent( `event_view_event_system_down` )
          return alert( `The POAP system is undergoing some maintenance, the QR dispenser might not work as expected during this time.\n\nPlease check our official channels for details.` )
        }

      } catch( e ) {
        log( `Error getting system health: `, e )
      }

    } )( )

    return () => cancelled = true

  }, [] )


  // Set url event ID to localstorage and remove it from the URL
  useEffect( (  ) => {

    // if no event id in URL, exit
    if( !eventId ) return log( 'No event ID in url, leaving localStorage as is' )

    // Set event ID to localstorage and internal state
    log( `Event ID changed to `, eventId )
    localStorage.setItem( 'cached_event_id', eventId )
    setInternalEventId( eventId )

    // Remove eventId from url by pushing with state
    navigate( '/event/', {
        eventId
    } )


  }, [ eventId ] )

  // Make sure relevant event ID is found, if not error
  useEffect( (  ) => {

    try {

      if( eventId ) return log( `Event ID present in url, ignoring localstorage` )
      log( `No event ID in url, loading event ID from localstorage` )
      const cached_event_id = localStorage.getItem( 'cached_event_id' )
      if( !cached_event_id ) throw new Error( `Error: No event ID known.\n\nMake sure to open this page through the event link from the admin interface.\n\nThis is an anti-abuse measure.` )
      trackEvent( `event_view_event_id_from_cache` )
      setInternalEventId( cached_event_id )
      setLoading( 'Loading event data' )

    } catch( e ) {

      log( `Error ocurred: `, e )
      alert( e.message )

      // If no event ID is known (both in local storage and url), forward to homepage
      navigate( '/' )

    }

  }, [ eventId ] )


  // Listen to event details on event ID change
  useEffect( () => {

		log( `New event ID ${ internalEventId } detected, listening to event meta` )
		if( internalEventId ) return listenToEventMeta( internalEventId, event => {
      setEvent( event )
      if( event?.template?.id ) setTemplate( event.template )
      setLoading( false )
    } )

  }, [ internalEventId ] )

  // On mount, do single force-refresh
  useEffect( () => {

    if( !internalEventId ) return log( `No internal event ID, cancelling manual code refresh` )

    log( `Triggering remote refresh of unknown and unscanned codes` )
    requestManualCodeRefresh( internalEventId )
    .then( ( { data } ) => log( `Force refresh update response: `, data ) )
    .catch( e => log( `Force refresh error `, e ) )

  }, [ internalEventId ] )

  // Update the state of scanned codes periodically
  useInterval( () => {

    if( !internalEventId ) return log( `No internal event ID, cancelling scanned code refresh` )

    refreshScannedCodesStatuses( internalEventId )
    .then( ( { data } ) => log( `Remote code update response : `, data ) )
    .catch( e => log( `Code refresh error `, e ) )

  }, scanInterval )

  // Debugging helper
  useEffect( f => {

    log( `For manual testing: ${REACT_APP_publicUrl}/${ internalEventId }/${ event?.public_auth?.token }?CI=true` )

  },  [ internalEventId, event ] )


  // ///////////////////////////////
  // Render component
  // ///////////////////////////////

  // If iframe mode, render only QR
  if( iframeMode ) return <QR key={ internalEventId + event?.public_auth?.token } margin='0' data-code={ `${ internalEventId }/${ event?.public_auth?.token }` } value={ `${ REACT_APP_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }${ force_appcheck_fail ? '?FORCE_INVALID_APPCHECK=true' : '' }` } />

  // Show welcome screen
  if( !acceptedTerms ) return <Container>

    <H1 align="center">Before we begin</H1>

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
  if( !event?.public_auth?.expires ) return <Container>

    <h1>No codes available</h1>
    <Sidenote onClick={ f => navigate( '/admin' ) }>If you just uploaded new ones, give the backend a minute to catch up. If nothing happens for a while, click here to open the admin interface.</Sidenote>

  </Container>

  // Display QR
  return <Container background={ template?.footer_icon }>

    {  /* Event metadata */ }
    { event && <H1 color={ template?.main_color } align="center">{ event.name }</H1> }
    { <H2 color={ template?.header_link_color } align="center">Scan the QR with your camera to claim your POAP</H2> }

    {  /* QR showing code */ }
    <QR key={ internalEventId + event?.public_auth?.token } className='glow' data-code={ `${ internalEventId }/${ event?.public_auth?.token }` } value={ `${ REACT_APP_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }${ force_appcheck_fail ? '?FORCE_INVALID_APPCHECK=true' : '' }` } />
    { /* <Button onClick={ nextCode }>Next code</Button> */ }

    { event && <Sidenote>{ event.codes - event.codesAvailable } of { event.codes } codes claimed or pending</Sidenote> }

    <Network />

  </Container>

}
