const { VITE_publicUrl } = import.meta.env

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { deleteEvent, trackEvent, listenToEventMeta, recalculate_available_codes } from '../../modules/firebase'
import { log, dev, wait } from '../../modules/helpers'


import Section from '../atoms/Section'

import Loading from '../molecules/Loading'
import Layout from '../molecules/Layout'

import { CardContainer, Container, Text, H1, H2, H3,  Input, Button, Dropdown, CardDashboard, Divider, Grid, Row, Col } from '@poap/poap-components'
import { useHealthCheck } from '../../hooks/health_check'
import { MethodCard } from '../molecules/MethodCard'
import ModalSide from '../molecules/ModalSide'

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

    // Data destructuring
    const { scans=0, codesAvailable=0, codes=0 } = event || {}

    // Health check
    useHealthCheck()

    // Modal state
    const [ isModalDestroy, setIsModalDestroy ] = useState( false )
    function handleOpenModal() {
        setIsModalDestroy( true )
    }
    function handleCloseModal() {
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

            if( !confirm( `${ t( 'eventAdmin.confirmDeleteDispenser' ) }` ) ) throw new Error( `${ t( 'eventAdmin.deletionCancelled' ) }` )

            setLoading( `${ t( 'eventAdmin.setLoadingDispenser' ) }` )
            log( `Deleting event ${ eventId } using auth token ${ authToken }` )
            const { data: { error } } = await deleteEvent( {
                eventId,
                authToken
            } )

            if( error ) throw new Error( error )

            alert( `${ t( 'eventAdmin.succesDeleteDispenser' ) }` )
            trackEvent( 'admin_event_deleted' )
            return navigate( '/' )

        } catch ( e ) {
            alert( `${ t( 'eventAdmin.errorDeleteDispenser', { message: e.message } ) }` )
            log( `Error deleting Kiosk:`, e )
            setLoading( false )
        }

    }

    // Recauculate available codes
    async function recalculateAvailableCodes() {

        try {

            // Confirm that the user realises this can be dangerous
            if( !confirm( `${ t( 'eventAdmin.confirmRecalculate' ) }` ) ) throw new Error( `${ t( 'eventAdmin.recalculationCancelled' ) }` )

            // Set loading state
            setLoading( `${ t( 'eventAdmin.recalculating' ) }` )

            // Recalculate available codes
            const { data: { error } } = await recalculate_available_codes( { eventId, authToken } )

            if( error ) throw new Error( error )

            alert( `${ t( 'eventAdmin.recalculationSuccess' ) }` )

        } catch ( e ) {
            log( `Error recalculating codes:`, e )
            alert( `${ e.message }` )
        } finally {
            setLoading( false )
        }

    }

    // ///////////////////////////////
    // Render component
    // ///////////////////////////////
    if( loading ) return <Loading message={ loading } />
    return <Layout hide_background>

        <Section margin='var(--spacing-4) 0 0 0'>
            <Container>
                { /* Heading */ }
                <H1 weight='700'>Admin panel for</H1>
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
                    <MethodCard event={ event } eventLink={ eventLink } adminLink={ adminLink } onDelete={ handleOpenModal }/>
                </Grid>

                { /* Old data */ }

                <CardContainer width='900px' margin='0 auto var(--spacing-6) auto'>
                    <Row margin='0 0 var(--spacing-6) 0'>
                        <Col size='3' align='flex-start'>
                            <H2 margin='0 0'>{ t( 'eventAdmin.editActions.editHeading' ) }</H2>
                            <Text>{ t( 'eventAdmin.editActions.editDescription' ) }</Text>
                                
                            <Row>
                                <Button variation="white" margin="0 .5rem 0 0" onClick={ recalculateAvailableCodes }>{ t( 'eventAdmin.editActions.recalculate' ) }</Button>
                                <Button variation="white" margin="0 .5rem 0 0" href="https://poap.zendesk.com/">{ t( 'eventAdmin.editActions.help' ) }</Button>
                            </Row>

                        </Col>
                        <Col size='1'></Col>
                    </Row>

                    { /* Event meta loaded, no codes available */ }

                    { !event.loading && !event.codes && <Section align='flex-start' margin="0">

                        <Text>{ t( 'eventAdmin.hero.notavailable.title' ) }</Text>
                        <Text>{ t( 'eventAdmin.hero.notavailable.description' ) }</Text>
                    </Section> }

                </CardContainer>

            </Container>
        </Section>

        { /* Modal for deleting kiosk */ }
        <ModalSide open={ isModalDestroy } setIsOpen={ setIsModalDestroy } showClose={ true }>

            <H3>Delete Kiosk</H3>
            <Divider />
            <Text>Are you sure you want to delete this kiosk? You can create a new kiosk for this POAP after deletion. </Text>

        </ModalSide>
    </Layout>

}