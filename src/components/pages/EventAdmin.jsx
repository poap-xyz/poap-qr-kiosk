const { VITE_publicUrl } = import.meta.env

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { deleteEvent, trackEvent, listenToEventMeta, recalculate_available_codes } from '../../modules/firebase'
import { log, dev, wait } from '../../modules/helpers'

import { useHealthCheck } from '../../hooks/health_check'

import { CardContainer, Container, Text, H1, H2, H3,  Input, Button, Dropdown, CardDashboard, Divider, Grid, Row, Col } from '@poap/poap-components'

import Section from '../atoms/Section'

import Loading from '../molecules/Loading'
import Layout from '../molecules/Layout'
import { MethodCard } from '../molecules/MethodCard'
import ModalSide from '../molecules/ModalSide'
import Modal from '../molecules/Modal'
import { serveToast } from '../molecules/Toast'

import { ReactComponent as SearchImage } from '../../assets/illustrations/search_statistics.svg'

const DoodasH1 = styled( H1 )`
    ::before {
        content: url('/assets/decorations/doodas_set_1.svg'); 
        position: absolute;
        left: -8rem;
        top: 2.5rem;
        /* transform: translateY(-50%);  */
        width: 20px; 
        height: auto;
        z-index: -1;
    }
`

const ModalContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`

const ModalButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
`

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function EventAdmin( ) {

    // Navigation
    const navigate = useNavigate()

    // i18next hook
    const { t } = useTranslation()

    // State handling
    const { eventId, authToken } = useParams( )
    const [ event, setEvent ] = useState( { loading: true } )
    const eventLink = `${ dev ? 'http://localhost:3000' : VITE_publicUrl }/#/event/${ eventId }`
    const adminLink = `${ dev ? 'http://localhost:3000' : VITE_publicUrl }/#/event/admin/${ eventId }/${ authToken }`
    const clipboardAPI = !!navigator.clipboard

    const [ backgroundTaps, setBackgroundTaps ] = useState( 0 )
    const developer_mode = backgroundTaps >= 20

    // Data destructuring
    const { scans=0, codesAvailable=0, codes=0 } = event || {}

    // Health check
    useHealthCheck()

    // Modal Recalculate state
    const [ isModalRecalculate, setIsModalRecalculate ] = useState( false )
    function handleOpenModalRecalculate() {
        setIsModalRecalculate( true )
    }
    function handleCloseModalRecalculate() {
        setIsModalRecalculate( false )
    }

    // Modal Delete state
    const [ isModalDestroy, setIsModalDestroy ] = useState( false )
    function handleOpenModalDestroy() {
        setIsModalDestroy( true )
    }
    function handleCloseModalDestroy() {
        setIsModalDestroy( false )
    }

    // ///////////////////////////////
    // State management
    // ///////////////////////////////
    const [ loading, setLoading ] = useState( `${ t( 'eventAdmin.loadingDispenser' ) }` )

    /* ///////////////////////////////
	// Lifecycle management
	// /////////////////////////////*/

    // Listen to event details on event ID change
    useEffect( () => {

        let cancelled = false

        log( `New event ID ${ eventId } detected, listening to event meta` )
        if( eventId ) return listenToEventMeta( eventId, async event => {
            setEvent( event )
            log( `Event data detected: `, event )
            setLoading( false )
            if( !event ) {

                // Wait for 5 seconds in case the backend is refreshng public event mets
                await wait( 5000 )
                if( !cancelled ) setLoading( `${ t( 'eventAdmin.loadingValidity' ) }` )

                // If after 10 seconds it is still down, trigger failure
                await wait( 5000 )
                if( !cancelled ) setLoading( `${ t( 'eventAdmin.invalidValidity' ) }` )

            }
        } )

        return () => cancelled = true

    }, [ eventId ] )

    // ///////////////////////////////
    // Component functions
    // ///////////////////////////////

    // Links management
    const focus = e => e.target.select()
    const clipboard = async text => {
        await navigator.clipboard.writeText( text )
        alert( `${ t( 'messaging.clipboard.copy' ) }` ) 
        trackEvent( 'admin_link_copied_clipboard' )
    }
    // Data management
    async function safelyDeleteEvent(  ) {

        try {

            setLoading( `${ t( 'eventAdmin.setLoadingDispenser' ) }` )
            log( `Deleting event ${ eventId } using auth token ${ authToken }` )
            const { data: { error } } = await deleteEvent( {
                eventId,
                authToken
            } )

            if( error ) throw new Error( error )

            serveToast( { message: `${ t( 'eventAdmin.succesDeleteDispenser' ) }`, type: 'success' } )
            trackEvent( 'admin_event_deleted' )
            return navigate( '/' )

        } catch ( e ) {
            handleCloseModalDestroy()
            serveToast( { message: `${ t( 'eventAdmin.errorDeleteDispenser', { message: e.message } ) }`, type: 'error' } )
            log( `Error deleting Kiosk:`, e )
            setLoading( false )
        }

    }

    // Recauculate available codes
    async function recalculateAvailableCodes() {

        try {

            // Set loading state
            setLoading( `${ t( 'eventAdmin.recalculating' ) }` )

            // Recalculate available codes
            const { data: { error } } = await recalculate_available_codes( { eventId, authToken } )

            if( error ) throw new Error( error )

            serveToast( { message: `${ t( 'eventAdmin.recalculationSuccess' ) }`, type: 'success' } )

        } catch ( e ) {
            log( `Error recalculating codes:`, e )
            serveToast( { message: e.message, type: 'error' } )
            handleCloseModalRecalculate()

        } finally {
            handleCloseModalRecalculate()
            setLoading( false )
        }

    }

    // ///////////////////////////////
    // Render component
    // ///////////////////////////////
    if( loading ) return <Loading message={ loading } />

    { /* Event meta loaded, no codes available */ }
    if( !event.loading && !event.codes ) return <Layout hide_background > 
        <Section align='flex-start' margin="0">

            <Text>{ t( 'eventAdmin.hero.notavailable.title' ) }</Text>
            <Text>{ t( 'eventAdmin.hero.notavailable.description' ) }</Text>

        </Section> 
    </Layout>
        

    return <Layout hide_background>

        <Section margin='var(--spacing-4) 0 0 0'>
            <Container>
                { /* Heading */ }
                <DoodasH1 weight='700'>Admin panel for</DoodasH1>
            </Container>
            <Container width='760px'>
                
                { /* Dashboard overview */ }
                <Grid>
                    <Row margin='0 auto 20px auto'>
                        <Col>
                            <CardDashboard event={ event?.event } codes={ event.codes }/>   
                        </Col>
                        
                    </Row>
                    <Row>
                        <Divider outline margin='0 auto 20px auto' />
                    </Row>
                    
                    { /* Admin panel */ }
                    <MethodCard event={ event } eventLink={ eventLink } adminLink={ adminLink } onDelete={ handleOpenModalDestroy } onRecalculate={ handleOpenModalRecalculate }/>
                </Grid>

            </Container>
        </Section>

        { /* Modal for deleting kiosk */ }
        <ModalSide open={ isModalRecalculate } setIsOpen={ setIsModalRecalculate } showClose={ true }>

            <ModalContainer>
                <H3 color='var(--primary-600)' margin='0 0 var(--spacing-4) 0'>Refresh counter</H3>
                <Divider margin='0 0 var(--spacing-7) 0'/>
                <Text>Are you sure you want to refresh the mint link counter? Your POAP Kiosk will be unstable and might not work as expected.</Text>
            </ModalContainer>

            <Divider plain style={ { color: 'var(--primary-200)', margin: 'auto 0 1rem 0' } } />

            <ModalButtonContainer>
                <Button variation='white' onClick={ handleCloseModalRecalculate }>Cancel</Button>
                <Button id='recalculateButton' onClick={ recalculateAvailableCodes }>Refresh</Button>
            </ModalButtonContainer>

        </ModalSide>

        { /* Modal for deleting kiosk */ }
        <ModalSide open={ isModalDestroy } setIsOpen={ setIsModalDestroy } showClose={ true }>

            <ModalContainer>
                <H3 color='var(--primary-600)' margin='0 0 var(--spacing-4) 0'>Delete Kiosk</H3>
                <Divider margin='0 0 var(--spacing-7) 0'/>
                <Text>Are you sure you want to delete this kiosk? You can create a new kiosk for this POAP after deletion. </Text>
            </ModalContainer>

            <Divider plain style={ { color: 'var(--primary-200)', margin: 'auto 0 1rem 0' } } />

            <ModalButtonContainer>
                <Button variation='white' onClick={ handleCloseModalDestroy }>Cancel</Button>
                <Button id='safelyDeleteButton' onClick={ safelyDeleteEvent }>Delete</Button>

            </ModalButtonContainer>
        </ModalSide>
    </Layout>

}