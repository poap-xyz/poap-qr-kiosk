const { REACT_APP_publicUrl } = process.env

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

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function EventAdmin( ) {

    // useTranslation loads the first namespace (example 1) by default and pre caches the second variable, the t hook still needs a reference like example 2.
    // Example 1: Translations for this organism are loaded by i18next like: t( 'key.reference' )
    // Example 2: Translations for sitewide texts are in Namespace 'dispenser' and are loaded like: t( 'key.reference', { ns: 'dispenser' } )
    const { t } = useTranslation( [ 'dynamic' , 'dispenser' ] )


    const { eventId, authToken } = useParams( )
    const [ event, setEvent ] = useState( { loading: true } )
    const navigate = useNavigate()
    const eventLink = `${ dev ? 'http://localhost:3000' : REACT_APP_publicUrl }/#/event/${ eventId }`
    const adminLink = `${ dev ? 'http://localhost:3000' : REACT_APP_publicUrl }/#/event/admin/${ eventId }/${ authToken }`
    const clipboardAPI = !!navigator.clipboard

    // Health check
    useEffect( (  ) => {

        let cancelled = false;

        ( async () => {

            try {

                const { data: health } = await health_check()
                log( `Systems health: `, health )
                if( cancelled ) return log( `Health effect cancelled` )
                if( !health.healthy ) return alert( `${ t( 'health.maintenance', { ns: 'dispenser' } ) }` )

            } catch ( e ) {
                log( `Error getting system health: `, e )
            }

        } )( )

        return () => cancelled = true

    }, [] )

    // ///////////////////////////////
    // State management
    // ///////////////////////////////
    const [ loading, setLoading ] = useState( `${ t( 'admin.loadingDispenser' ) }` )

    /* ///////////////////////////////
	// Lifecycle management
	// /////////////////////////////*/

    // Listen to event details on event ID change
    useEffect( () => {

        let cancelled = false

        log( `New event ID ${ eventId } detected, listening to event meta` )
        if( eventId ) return listenToEventMeta( eventId, event => {
            setEvent( event )
            log( `Event data detected: `, event )
            setLoading( false )
            if( !event ) {

                // Wait for 5 seconds in case the backend is refreshng public event mets
                wait( 5000 )
                if( !cancelled ) setLoading( `${ t( 'admin.loadingValidity' ) }` )

                // If after 10 seconds it is still down, trigger failure
                wait( 5000 )
                if( !cancelled ) setLoading( `${ t( 'admin.invalidValidity' ) }` )

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
        alert( `${ t( 'clipboardCopy', { ns: 'dispenser' } ) }` ) 
        trackEvent( 'admin_link_copied_clipboard' )
    }
    // Data management
    async function safelyDeleteEvent(  ) {

        try {

            if( !confirm( `${ t( 'admin.confirmDeleteDispenser' ) }` ) ) throw new Error( `${ t( 'admin.deletionCancelled' ) }` )

            setLoading( `${ t( 'admin.setLoadingDispenser' ) }` )
            const { data: { error } } = await deleteEvent( {
                eventId,
                authToken
            } )

            if( error ) throw new Error( error )

            alert( `${ t( 'admin.succesDeleteDispenser' ) }` )
            trackEvent( 'admin_event_deleted' )
            return navigate( '/' )

        } catch ( e ) {
            alert( `${ t( 'admin.errorDeleteDispenser', { message: e.message } ) }` )
            log( e )
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
                
                <CardContainer margin='0 0 var(--spacing-6) 0'>
                    <H1 align='center'>{ t( 'admin.title' ) }</H1>
                    <Grid>

                        { /* Event meta loaded, codes available */ }
                        { !event.loading && event.codes && <>
                            <Row>
                                <Col size='3'>
                                    <Text>
                                        { t( 'admin.hero.description.pre' ) }<b>{ t( 'admin.hero.description.bold' ) }</b>{ t( 'admin.hero.description.post' ) }
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
                                        label={ t( 'admin.hero.input.label' ) }
                                        value={ eventLink }
                                        info={ t( 'admin.hero.input.info' ) }
                                    />
                                </Col>
                                <Col size='4' direction='row' align='center'>
                                    { clipboardAPI && <Button margin=".5em 0 0 .5rem" variation='white' onClick={ f => clipboard( eventLink ) }>{ t( 'admin.hero.distribute.clipboard' ) }</Button> }

                                </Col>
                            </Row>
                            <Row margin='var(--spacing-2) 0 var(--spacing-4) 0'>
                                <Col size='1' direction='row' align='center'>
                                    <Button margin=".5em .5rem 0 0" onClick={ f => window.open( eventLink, '_self' ) }>{ t( 'admin.hero.distribute.button' ) }</Button>
                                </Col>
                            </Row>

                        </> }
                    </Grid>
                </CardContainer>
                <CardContainer>
                    <H1>{ t( 'admin.deleteDispenser.title' ) }</H1>
                    <Grid>
                        <Row>
                            <Col size='3'>
                                <Text>

                                    <H2 margin='0'>{ t( 'admin.adminDispenser.title' ) }</H2>
                                    <Text>{ t( 'admin.adminDispenser.description' ) }</Text>                                    </Text>
                            </Col>
                            <Col size='1'></Col>
                        </Row>
                        <Row margin='0 0 var(--spacing-6) 0'>
                            <Col size='8'>
                                <Input
                                    id='admin-eventlink-secret'
                                    readOnly
                                    onClick={ focus }
                                    label={ t( 'admin.adminDispenser.input.label' ) }
                                    value={ adminLink }
                                    info={ t( 'admin.adminDispenser.input.info' ) }
                                />
                            </Col>
                            <Col size='4' direction='row' align='center'>
                                { clipboardAPI && <Button margin=".5em 0 0 .5rem" variation='white' onClick={ f => clipboard( adminLink ) }>{ t( 'admin.adminDispenser.clipboard' ) }</Button> }

                            </Col>
                        </Row>

                        <Row>
                            <Col size='3' align='flex-start'>
                                <H2 margin='0'>{ t( 'admin.deleteDispenser.subheading' ) }</H2>
                                <Text>{ t( 'admin.deleteDispenser.description' ) }</Text>
                                <Button variation='red' onClick={ safelyDeleteEvent }>{ t( 'admin.deleteDispenser.deleteBtn' ) }</Button>

                            </Col>
                            <Col size='1'></Col>
                        </Row>
                        { /* Event meta loaded, no codes available */ }

                        { !event.loading && !event.codes && <Section align='flex-start' margin="0">

                            <Text>{ t( 'admin.hero.notavailable.title' ) }</Text>
                            <Text>{ t( 'admin.hero.notavailable.description' ) }</Text>
                        </Section> }

                    </Grid>
                </CardContainer>

            </Container>
        </Section>
    </Layout>

}