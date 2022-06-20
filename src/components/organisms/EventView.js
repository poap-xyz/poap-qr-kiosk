// Data management
import { useState, useEffect } from 'react'
import { requestManualCodeRefresh, listenToEventMeta, refreshScannedCodesStatuses, trackEvent, health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useInterval from 'use-interval'
import { useTranslation } from 'react-i18next'

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

  const { t } = useTranslation( [ 'eventView' , 'dispenser' ] )

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
  const [ loading, setLoading ] = useState( `${ t( 'setKiosk' ) }` )
  const [ event, setEvent ] = useState(  )
  const [ template, setTemplate ] = useState( {} )
	const [ internalEventId, setInternalEventId ] = useState( eventId || stateEventId )
  const [ scanInterval, setScanInterval ] = useState( defaultScanInerval )
  const [ acceptedTerms, setAcceptedTerms ] = useState( viewMode == 'silent' )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

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
          return alert( `${ t( 'health.maintenance', { ns: 'dispenser' } ) }` )
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
      if( !cached_event_id ) throw new Error( `${ t( 'eventNoCache' ) }` )
      trackEvent( `event_view_event_id_from_cache` )
      setInternalEventId( cached_event_id )
      setLoading( `${ t( 'eventLoading' ) }` )

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

  // Show welcome screen
  if( !acceptedTerms ) return <Container>
    
    <H1 align="center">{ t( 'terms.title' ) }</H1>

    <H2>{ t( 'terms.subheading' ) }</H2>
    <Text align="center">{ t( 'terms.description' ) }</Text>

    <Button id="event-view-accept-disclaimer" onClick={ f => setAcceptedTerms( true ) }>{ t( 'terms.acceptBtn' ) }</Button>

  </Container>

  // loading screen
  if( loading ) return <Loading message={ loading } />

  // Expired event error
  if( event?.expires && event.expires < Date.now() ) return <Container>
  
    <h1>{ t( 'expired.title' ) }</h1>
    <Sidenote>{ t( 'expired.description', { expireDate: new Date( event.expires ).toString(  ) } ) }</Sidenote>
    
  </Container>

  // No code error
  if( !event?.public_auth?.expires ) return <Container>
  
    <h1>{ t( 'codes.title' ) }</h1>
    <Sidenote onClick={ f => navigate( '/admin' ) }>{ t( 'codes.description' ) }</Sidenote>
    
  </Container>
  
  // Display QR
  log( template )
  return <Container background={ template?.footer_icon }>

    {  /* Event metadata */ }
    { event && <H1 color={ template?.main_color } align="center">{ event.name }</H1> }
    { <H2 color={ template?.header_link_color } align="center">{ t( 'view.subheading' ) }</H2> }

    {  /* QR showing code */ }
    <QR key={ internalEventId + event?.public_auth?.token } className='glow' data-code={ `${ internalEventId }/${ event?.public_auth?.token }` } value={ `${ REACT_APP_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }${ force_appcheck_fail ? '?FORCE_INVALID_APPCHECK=true' : '' }` } />
    { /* <Button onClick={ nextCode }>Next code</Button> */ }

    { event && <Sidenote>{ t( 'view.claimed', { available: event.codes - event.codesAvailable, codes: event.codes } ) }</Sidenote> }
    
    <Network />

  </Container>

}
