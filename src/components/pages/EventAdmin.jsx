const { VITE_publicUrl } = import.meta.env

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { deleteEvent, trackEvent, health_check, listenToEventMeta } from '../../modules/firebase'
import { log, dev, wait } from '../../modules/helpers'


import Section from '../atoms/Section'
import { Grid, Row, Col } from '../atoms/Grid'

import Loading from '../molecules/Loading'
import Layout from '../molecules/Layout'

import { CardContainer, Container, Text, H1, H2, Input, Button } from '@poap/poap-components'
import { useHealthCheck } from '../../hooks/health_check'

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
    const { scans=0, codesAvailable=0, codes=0 } = event

    // Health check
    useHealthCheck()
    
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

    // ///////////////////////////////
    // Render component
    // ///////////////////////////////
    if( loading ) return <Loading message={ loading } />
    return <Layout>

        <Section>
            <Container>
                
                <CardContainer width='900px' margin='0 auto var(--spacing-6) auto'>
                    <H1 align='center'>{ t( 'eventAdmin.title' ) }</H1>
                    <Grid>

                        { /* Event meta loaded, codes available */ }
                        { !event.loading && event.codes && <>
                            <Row>
                                <Col size='3'>
                                    <Text>
                                        { t( 'eventAdmin.hero.description.pre' ) }<b>{ t( 'eventAdmin.hero.description.bold' ) }</b>{ t( 'eventAdmin.hero.description.post' ) }
                                    </Text>
                                </Col>
                                <Col size='1'></Col>
                            </Row>
                            <Row>
                                <Col size='8'>
                                    <Input
                                        id='admin-eventlink-public' 
                                        readOnly
                                        onClick={ focus }
                                        label={ t( 'eventAdmin.hero.input.label' ) }
                                        value={ eventLink }
                                        info={ t( 'eventAdmin.hero.input.info' ) }
                                    />
                                </Col>
                                <Col size='4' direction='row' align='center'>
                                    { clipboardAPI && <Button margin=".5em 0 0 .5rem" variation='white' onClick={ f => clipboard( eventLink ) }>{ t( 'eventAdmin.hero.distribute.clipboard' ) }</Button> }

                                </Col>
                            </Row>
                            <Row margin='var(--spacing-2) 0 var(--spacing-4) 0'>
                                <Col size='1' direction='row' align='center'>
                                    <Button margin=".5em .5rem 0 0" onClick={ f => window.open( eventLink, '_self' ) }>{ t( 'eventAdmin.hero.distribute.button' ) }</Button>
                                </Col>
                            </Row>

                        </> }
                    </Grid>
                </CardContainer>

                <CardContainer width='900px' margin='0 auto var(--spacing-6) auto'>
                    <H1>{ t( 'eventAdmin.deleteDispenser.title' ) }</H1>
                    <Text>
                        { t( 'eventAdmin.amountScannedMessage', { codes, scans, claimed: codes - codesAvailable } ) }
                    </Text>
                    <Grid>
                        <Row>
                            <Col size='3'>
                                <H2 margin='0'>{ t( 'eventAdmin.adminDispenser.title' ) }</H2>
                                <Text>{ t( 'eventAdmin.adminDispenser.description' ) }</Text>
                            </Col>
                            <Col size='1'></Col>
                        </Row>
                        <Row margin='0 0 var(--spacing-6) 0'>
                            <Col size='8'>
                                <Input
                                    id='admin-eventlink-secret'
                                    readOnly
                                    onClick={ focus }
                                    label={ t( 'eventAdmin.adminDispenser.input.label' ) }
                                    value={ adminLink }
                                    info={ t( 'eventAdmin.adminDispenser.input.info' ) }
                                />
                            </Col>
                            <Col size='4' direction='row' align='center'>
                                { clipboardAPI && <Button margin=".5em 0 0 .5rem" variation='white' onClick={ f => clipboard( adminLink ) }>{ t( 'eventAdmin.adminDispenser.clipboard' ) }</Button> }

                            </Col>
                        </Row>

                        <Row>
                            <Col size='3' align='flex-start'>
                                <H2 margin='0'>{ t( 'eventAdmin.deleteDispenser.subheading' ) }</H2>
                                <Text>{ t( 'eventAdmin.deleteDispenser.description' ) }</Text>
                                <Button variation='red' onClick={ safelyDeleteEvent }>{ t( 'eventAdmin.deleteDispenser.deleteBtn' ) }</Button>

                            </Col>
                            <Col size='1'></Col>
                        </Row>
                        { /* Event meta loaded, no codes available */ }

                        { !event.loading && !event.codes && <Section align='flex-start' margin="0">

                            <Text>{ t( 'eventAdmin.hero.notavailable.title' ) }</Text>
                            <Text>{ t( 'eventAdmin.hero.notavailable.description' ) }</Text>
                        </Section> }

                    </Grid>
                </CardContainer>

            </Container>
        </Section>
    </Layout>

}