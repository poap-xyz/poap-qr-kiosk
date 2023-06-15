// Data management
import { useState, useEffect } from 'react'
import { requestManualCodeRefresh, listenToEventMeta, refreshScannedCodesStatuses, trackEvent, health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useInterval from 'use-interval'
import { useTranslation } from 'react-i18next'

// Debugging data
let { REACT_APP_publicUrl, REACT_APP_useEmulator } = process.env
log( `Frontend using live url ${ REACT_APP_publicUrl } with ${ REACT_APP_useEmulator ? 'emulator' : 'live backend' }` )

// Components
import AnnotatedQR from '../molecules/AnnotatedQR'
import Loading from '../molecules/Loading'
import Network from '../molecules/NetworkStatusBar'

import { H1, H2, H3, Text, Sidenote, Button, Container, CardContainer, Divider } from '@poap/poap-components'
import ViewWrapper from '../atoms/ViewWrapper'
import Section from '../atoms/Section'


// Assets
import { ReactComponent as UserConnected } from '../../assets/illustrations/user_connected.svg'
import { ReactComponent as ManMoon } from '../../assets/illustrations/man_to_the_moon.svg'
import { ReactComponent as NoCodes } from '../../assets/illustrations/no_more_codes.svg'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

    // useTranslation loads the first namespace (example 1) by default and pre caches the second variable, the t hook still needs a reference like example 2.
    // Example 1: Translations for this organism are loaded by i18next like: t( 'key.reference' )
    // Example 2: Translations for sitewide texts are in Namespace 'dispenser' and are loaded like: t( 'key.reference', { ns: 'dispenser' } )
    const { t } = useTranslation( [ 'dynamic' , 'dispenser' ] )

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
    const scanInterval = 2 * 60 * 1000
    const [ loading, setLoading ] = useState( `${ t( 'view.setKiosk' ) }` )
    const [ event, setEvent ] = useState(  )
    const [ template, setTemplate ] = useState( {} )
    const [ internalEventId, setInternalEventId ] = useState( eventId || stateEventId )
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
                    return alert( `${ t( 'health.maintenance', { ns: 'dispenser' } ) }` )
                }

            } catch ( e ) {
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
            if( !cached_event_id ) throw new Error( `${ t( 'view.eventNoCache' ) }` )
            trackEvent( `event_view_event_id_from_cache` )
            setInternalEventId( cached_event_id )
            setLoading( `${ t( 'view.eventLoading' ) }` )

        } catch ( e ) {

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

        log( `For manual testing: ${ REACT_APP_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }?CI=true` )

    },  [ internalEventId, event ] )


    // ///////////////////////////////
    // Render component
    // ///////////////////////////////

    // If iframe mode, render only QR
    if( iframeMode ) return <AnnotatedQR key={ internalEventId + event?.public_auth?.token } margin='0' data-code={ `${ internalEventId }/${ event?.public_auth?.token }` } value={ `${ REACT_APP_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }${ force_appcheck_fail ? '?FORCE_INVALID_APPCHECK=true' : '' }` } />

    // Show welcome screen
    if( !acceptedTerms ) return <ViewWrapper center show_bookmark>

        <Section>
            <Container>
                <CardContainer width='400px'>

                    <UserConnected />
                    <br />
                    <H3>{ t( 'view.terms.subheading' ) }</H3>
                    <Divider />
                    <br />
                    <Text align="center">{ t( 'view.terms.description' ) }</Text>

                    <Button id="event-view-accept-disclaimer" onClick={ f => setAcceptedTerms( true ) }>{ t( 'view.terms.acceptBtn' ) }</Button>

                </CardContainer>
            </Container>
        </Section>

    </ViewWrapper>

    // loading screen
    if( loading ) return <Loading message={ loading } />

    // Expired event error
    if( event?.expires && event.expires < Date.now() ) return <ViewWrapper center show_bookmark>

        <Section>
            <Container>
                <CardContainer width='400px'>

                    <ManMoon />
                    <br />
                    <h3>{ t( 'view.expired.title' ) }</h3>
                    <Divider />
                    <br />
                    <Text align='center'>{ t( 'view.expired.description', { expireDate: new Date( event.expires ).toString(  ) } ) }</Text>

                </CardContainer>
            </Container>
        </Section>

    </ViewWrapper>

    // No code error
    // if( !event?.public_auth?.expires ) return <Container>
    if( !event?.public_auth?.expires ) return <ViewWrapper center show_bookmark>

        <Section>
            <Container>
                <CardContainer width='400px'>

                    <NoCodes />
                    <br />
                    <h3>{ t( 'view.codes.title' ) }</h3>
                    <Divider />
                    <br />
                    <Text onClick={ f => navigate( '/admin' ) } align='center'>{ t( 'view.codes.description' ) }</Text>

                </CardContainer>
            </Container>
        </Section>

    </ViewWrapper>

    // Display QR
    return <Container background={ template?.footer_icon } show_bookmark>

        {  /* Event metadata */ }
        { event && <H1 color={ template?.main_color } align="center">{ event.name }</H1> }
        <H2 color={ template?.header_link_color || 'var(--primary-600)' } align="center">{ t( 'view.display.subheading' ) }</H2>

        {  /* QR showing code */ }
        <AnnotatedQR key={ internalEventId + event?.public_auth?.token } className='glow' data-code={ `${ internalEventId }/${ event?.public_auth?.token }` } value={ `${ REACT_APP_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }${ force_appcheck_fail ? '?FORCE_INVALID_APPCHECK=true' : '' }` } />
        { /* <Button onClick={ nextCode }>Next code</Button> */ }

        { event && <Sidenote margin='0'>{ t( 'view.display.claimed', { available: event.codes - event.codesAvailable, codes: event.codes } ) }</Sidenote> }
    
        <Network />

    </Container>

}
