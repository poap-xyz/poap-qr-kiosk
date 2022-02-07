// Data management
import { useState, useEffect } from 'react'
import { requestManualCodeRefresh, listenToEventMeta, refreshScannedCodesStatuses, trackEvent } from '../../modules/firebase'
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

  // Event ID form url
  const { eventId, viewMode } = useParams()

  // Event ID from pushed state
  const { eventId: stateEventId } = history.location

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const defaultScanInerval = 2 * 60 * 1000
  const [ loading, setLoading ] = useState( 'Setting up your Kiosk' )
  const [ event, setEvent ] = useState(  )
	const [ internalEventId, setInternalEventId ] = useState( eventId || stateEventId )

  const [ scanInterval, setScanInterval ] = useState( defaultScanInerval )
  const [ acceptedTerms, setAcceptedTerms ] = useState( false )
  const [ mode, setMode ] = useState( viewMode )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Set url event ID to localstorage and remove it from the URL
  useEffect( (  ) => {

    // if no event id in URL, exit
    if( !eventId ) return log( 'No event ID in url, leaving localStorage as is' )

    // Set event ID to localstorage and internal state
    log( `Event ID changed to `, eventId )
    localStorage.setItem( 'cached_event_id', eventId )
    setInternalEventId( eventId )

    // Remove eventId from url by pushing with state
    history.push( '/event/', {
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
      setInternalEventId( cached_event_id )
      setLoading( 'Loading event data' )

    } catch( e ) {

      log( `Error ocurred: `, e )
      alert( e.message )

    }

  }, [ eventId ] )


  // Listen to event details on event ID change
  useEffect( () => {

		log( `New event ID ${ internalEventId } detected, listening to event meta` )
		if( internalEventId ) return listenToEventMeta( internalEventId, event => {
      setEvent( event )
      setLoading( false )
    } )

  }, [ internalEventId ] )

  // On mount, do single force-refresh
  useEffect( () => {

    requestManualCodeRefresh()
    .then( ( { data } ) => log( `Force refresh update response : `, data ) )
    .catch( e => log( `Force refresh error `, e ) )

  }, [] )

  // Update the state of scanned codes periodically
  useInterval( () => {
    refreshScannedCodesStatuses()
    .then( ( { data } ) => log( `Remote code update response : `, data ) )
    .catch( e => log( `Code refresh error `, e ) )
  }, scanInterval )

  // Debugging helper
  useEffect( f => log( `For manual testing: https://qr-kiosk-dev.web.app/claim/${ internalEventId }/${ event?.public_auth?.token }?CI=true` ),  [ internalEventId, event ] )


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
  if( !event?.public_auth?.expires ) return <Container>
  
    <h1>No codes available</h1>
    <Sidenote onClick={ f => history.push( '/admin' ) }>If you just uploaded new ones, give the backend a minute to catch up. If nothing happens for a while, click here to open the admin interface.</Sidenote>
    
  </Container>
  
  // Display QR
  return <Container>

    {  /* Event metadata */ }
    { event && <H1 align="center">{ event.name }</H1> }
    { <H2 align="center">Scan the QR with your camera to claim your POAP</H2> }

    {  /* QR showing code */ }
    <QR key={ internalEventId + event?.public_auth?.token } className='glow' data-code={ `${ internalEventId }/${ event?.public_auth?.token }` } value={ `${ REACT_APP_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }` } />
    { /* <Button onClick={ nextCode }>Next code</Button> */ }

    { event && <Sidenote>{ event.codes - event.codesAvailable } of { event.codes } codes claimed or pending</Sidenote> }

    <Network />

  </Container>

}
