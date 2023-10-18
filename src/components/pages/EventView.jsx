let { VITE_publicUrl } = import.meta.env

import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useInterval from 'use-interval'
import { useTranslation } from 'react-i18next'

import { requestManualCodeRefresh, refreshScannedCodesStatuses, trackEvent, get_emulator_function_call_url, log_kiosk_open } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'

import Section from '../atoms/Section'
import Loading from '../molecules/Loading'
import Network from '../molecules/NetworkStatusBar'
import ViewWrapper from '../molecules/ViewWrapper'

import { H1, H2, H3, Text, Button, Container, CardContainer, Divider } from '@poap/poap-components'

import { ReactComponent as UserConnected } from '../../assets/illustrations/user_connected.svg'
import { ReactComponent as ManMoon } from '../../assets/illustrations/man_to_the_moon.svg'
import { ReactComponent as NoCodes } from '../../assets/illustrations/no_more_codes.svg'
import ExpiredQR from '../molecules/AnExpiredQR'
import { useHealthCheck } from '../../hooks/health_check'
import { useEvent, useEventTemplate } from '../../hooks/events'
import ScannablePreview from '../organisms/ScannablePreview'
import EventQR from '../organisms/EventQR'
import CustomCssWrapper from '../molecules/CustomCssWrapper'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

    const { t } = useTranslation()

    const navigate = useNavigate()
    const location = useLocation()

    // Event ID form url
    const { eventId, viewMode } = useParams()
    const event_id_is_cached = eventId === 'cached'

    // Event ID from pushed state
    const { eventId: stateEventId } = location

    // ///////////////////////////////
    // State handling
    // ///////////////////////////////
    const [ internalEventId, setInternalEventId ] = useState( stateEventId || eventId )
    const [ acceptedTerms, setAcceptedTerms ] = useState( viewMode == 'silent' )
    const [ iframeMode, setIframeMode ] = useState( false )
    const event = useEvent( internalEventId )
    const template = useEventTemplate( internalEventId )

    // ///////////////////////////////
    // Lifecycle handling
    // ///////////////////////////////

    // Mode handling
    useEffect( f => {

        if( !viewMode ) return
        if( viewMode == 'silent' ) setAcceptedTerms( true )
        if( viewMode == 'iframe' ) setIframeMode( true )

    }, [ viewMode ] )

    // Health check, alerts internally
    const is_healthy = useHealthCheck()

    // Once the event data is loaded, mark this kiosk open
    useEffect( (  ) => {

        // If no event data, exit
        if( !event?.name || !internalEventId ) {
            log( `No event data, not registering kiosk open: `, internalEventId, event )
            return
        }
        

        // Once the event was loaded, register this open with the backend
        // note: this is an async function
        log_kiosk_open( internalEventId )


    }, [ internalEventId, event?.name ] )

    // Set url event ID to localstorage and remove it from the URL
    useEffect( (  ) => {

        // if no event id in URL, exit
        if( !eventId ) return log( 'No event ID in url, leaving localStorage as is' )

        // if no event id in URL, exit
        if( event_id_is_cached ) return log( 'URL indicates cached eventId, leaving localStorage as is' )

        // Set event ID to localstorage and internal state
        log( `Event ID changed to `, eventId )
        localStorage.setItem( 'cached_event_id', eventId )
        setInternalEventId( eventId )

        // Remove eventId from url by pushing with state
        navigate( viewMode == 'iframe' ? '/event/cached/iframe' : '/event/', {
            eventId
        } )


    }, [ eventId ] )

    // Make sure relevant event ID is found, if not error
    useEffect( (  ) => {

        try {

            if( eventId && !event_id_is_cached ) return log( `Event ID present in url, ignoring localstorage` )
            
            log( `${ event_id_is_cached ? `Event ID is cached`: `No event ID in url` } loading event ID from localstorage` )
            const cached_event_id = localStorage.getItem( 'cached_event_id' )
            if( !cached_event_id ) throw new Error( `${ t( 'eventView.eventNoCache' ) }` )
            trackEvent( `event_view_event_id_from_cache` )
            setInternalEventId( cached_event_id )

        } catch ( e ) {

            log( `Error ocurred: `, e )
            alert( e.message )

            // If no event ID is known (both in local storage and url), forward to homepage
            navigate( '/' )

        }

    }, [ eventId ] )

    // On mount, do single code force-refresh
    useEffect( () => {

        if( !internalEventId || internalEventId == 'cached' ) return log( `No internal event ID, cancelling manual code refresh` )

        log( `Triggering remote refresh of unknown and unscanned codes` )
        requestManualCodeRefresh( internalEventId )
            .then( ( { data } ) => log( `Force refresh update response: `, data ) )
            .catch( e => log( `Force refresh error `, e ) )

    }, [ internalEventId ] )

    // Update the state of scanned codes periodically
    const scanInterval = 2 * 60 * 1000
    useInterval( () => {

        if( !internalEventId || internalEventId == 'cached' ) return log( `No internal event ID, cancelling scanned code refresh` )

        refreshScannedCodesStatuses( internalEventId )
            .then( ( { data } ) => log( `Remote code update response : `, data ) )
            .catch( e => log( `Code refresh error `, e ) )

    }, scanInterval )

    // Debugging helper
    useEffect( f => {

        if( !event ) return
        log( `For manual testing: \n${ dev ? get_emulator_function_call_url( 'claimMiddleware' ) : VITE_publicUrl }/claim/${ internalEventId }/${ event?.public_auth?.token }?CI=true` )

    },  [ event?.public_auth?.token ] )

    /* ///////////////////////////////
    // Loading states
    // /////////////////////////////*/

    // Iframe renderer should remain empty until event data arrives
    if( iframeMode && !event ) return null

    // Loading state
    if( !iframeMode && !event ) return <Loading message={ t( 'eventView.eventLoading' ) } />


    // ///////////////////////////////
    // Render iframe component
    // ///////////////////////////////

    // Expired event qr error
    if( iframeMode && event?.expires && event.expires < Date.now() ) return <CustomCssWrapper>
        <ExpiredQR status='expired'/>
    </CustomCssWrapper>

    // // No code qr error
    if( iframeMode && !event?.public_auth?.expires ) return <CustomCssWrapper>
        <ExpiredQR status='noCodes'/>
    </CustomCssWrapper>

    // If iframe mode, render only QR
    if( iframeMode ) return <CustomCssWrapper>
        <EventQR id="iframe-mode-qr" color="black" background="white" event_id={ internalEventId } />
    </CustomCssWrapper>

    // ///////////////////////////////
    // Error states
    // ///////////////////////////////

    // Expired event error
    if( event?.expires && event.expires < Date.now() ) return <ViewWrapper center show_bookmark>

        <Section>
            <Container>
                <CardContainer width='400px'>

                    <ManMoon />
                    <br />
                    <H3>{ t( 'eventView.expired.title' ) }</H3>
                    <Divider />
                    <br />
                    <Text align='center'>{ t( 'eventView.expired.description', { expireDate: new Date( event.expires ).toString(  ) } ) }</Text>

                </CardContainer>
            </Container>
        </Section>

    </ViewWrapper>

    // No code error
    if( !event?.public_auth?.expires ) return <ViewWrapper center show_bookmark>

        <Section>
            <Container>
                <CardContainer width='400px'>

                    <NoCodes />
                    <br />
                    <H3>{ t( 'eventView.codes.title' ) }</H3>
                    <Divider />
                    <br />
                    { /* TODO discuss link */ }
                    <Text align='center'>{ t( 'eventView.codes.description' ) }</Text>
                    { /* <Text onClick={ f => navigate( '/event/admin' ) } align='center'>{ t( 'eventView.codes.description' ) }</Text> */ }

                </CardContainer>
            </Container>
        </Section>

    </ViewWrapper>

    /* ///////////////////////////////
    // Render default component
    // /////////////////////////////*/

    // Show welcome screen
    if( !acceptedTerms ) return <ViewWrapper center show_bookmark>

        <Section>
            <Container>
                <CardContainer width='400px'>

                    <UserConnected />
                    <br />
                    <H3>{ t( 'eventView.terms.subheading' ) }</H3>
                    <Divider />
                    <br />
                    <Text align="center">{ t( 'eventView.terms.description' ) }</Text>

                    <Button id="event-view-accept-disclaimer" onClick={ f => setAcceptedTerms( true ) }>{ t( 'eventView.terms.acceptBtn' ) }</Button>

                </CardContainer>
            </Container>
        </Section>

    </ViewWrapper>

    // Display QR
    return <ViewWrapper hide_header hide_footer center background={ template?.footer_icon } show_bookmark>

        {  /* Event metadata */ }
        { event && <H1 color={ template?.main_color } align="center">{ event.name }</H1> }
        <H2 color={ template?.header_link_color || 'var(--primary-600)' } align="center">{ t( 'eventView.display.subheading' ) }</H2>


        {  /* QR showing code */ }
        <ScannablePreview event_id={ internalEventId } />
        
    
        <Network />

    </ViewWrapper>

}
