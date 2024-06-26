import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Papa from 'papaparse'

// Functionality
import { registerEvent, trackEvent, getEventDataFromCode, health_check } from '../../modules/firebase'
import { log, dateOnXDaysFromNow, monthNameToNumber, dev } from '../../modules/helpers'

// Components
import Section from '../atoms/Section'
import { Col, Grid, Row } from '../atoms/Grid'

import Loading from '../molecules/Loading'
import Layout from '../molecules/Layout'
import FormFooter from '../molecules/FormFooter'
import { UploadButton } from '../molecules/UploadButton'

import { Button, CardContainer, Container, H3, Input, Dropdown, CardDashboard, useViewport } from '@poap/poap-components'
import Select from '../atoms/Select'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function Admin( ) {

    // Navigation
    const navigate = useNavigate()

    // i18next hook
    const { t } = useTranslation()

    // Responsive helpers
    const { isMobile } = useViewport()

    // ///////////////////////////////
    // State handling
    // ///////////////////////////////

    const [ email, setEmail ] = useState( dev ? 'ruben@poap.io' : '' )
    const [ date, setDate ] = useState( '' )
    const [ name, setName ] = useState( '' )
    const [ currentEvent, setEvent ] = useState( '' )
    const [ dropId, setDropId ] = useState( '' )
    const [ csv, setCsv ] = useState(  )
    const [ css, setCss ] = useState(  )
    const [ customBaseurl, setCustomBaseurl ] = useState(  )
    const [ codes, setCodes ] = useState(  )
    const [ abuseProtection, setAbuseProtection ] = useState( 'naive' )
    const [ gameDuration, setGameDuration ] = useState( 30 )
    const [ loading, setLoading ] = useState( false )
    const [ filename, setFilename ] = useState( 'codes.txt' )
    const [ isHealthy, setIsHealthy ] = useState( true )
    const [ backgroundTaps, setBackgroundTaps ] = useState( 0 )
    const [ collectEmails, setCollectEmails ] = useState( 'no' )
    const developer_mode = backgroundTaps >= 20

    // Email collection options
    const email_collect_options = [
        {
            label: t( 'eventCreate.form.dropCollectEmails.options', { returnObjects: true } )?.[0]?.label,
            value: 'no'
        },
        {
            label: t( 'eventCreate.form.dropCollectEmails.options', { returnObjects: true } )?.[1]?.label,
            value: 'yes'
        }
    ]

    const gameOptions = [
        {
            label: 'No anti-abuse protections (only in trusted environments)',
            value: 'naive'
        },
        {
            label: 'Automated background checks only (physical events)',
            value: 'background'
        },   
        {
            label: 'Automated checks & anti-farming game (online events)',
            value: 'game'
        },
    ]

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
                    setIsHealthy( false )
                    trackEvent( `event_view_event_system_down` )
                    return alert( `${ t( 'messaging.health.maintenance' ) }` )
                }

            } catch ( e ) {
                log( `Error getting system health: `, e )
            }

        } )( )

        return () => cancelled = true

    }, [] )

    // File validations and loading
    useEffect( f => {

        let cancelled = false

        if( !csv ) return

        ( async f => {

            try {

                // Loading animation
                setLoading( `${ t( 'eventCreate.file.mintCheck' ) }` )

                // Validations
                const { name } = csv
                if( !name.includes( '.csv' ) && !name.includes( '.txt' ) ) throw new Error( `${ t( 'eventCreate.file.acceptedFormat' ) }` )

                // Set filename to state
                setFilename( name )

                // Load csv data
                let data = await parseCsv( csv )
                log( 'Raw codes loaded: ', data )

                // Remove website prefix and trim
                data = data.map( code => `${ code }`.replace( /(https?:\/\/.*\/)/ig, '' ).trim() )

                // Take out empty lines
                data = data.filter( code => code.length != 0 )

                // Find faulty codes
                const erroredCodes = data.filter( code => !code.match( /\w{1,42}/ )  )

                // Let user know about faulty codes
                if( erroredCodes.length ) {

                    log( 'Errored codes: ', erroredCodes )
                    throw new Error( `${ erroredCodes.length } ${ t( 'eventCreate.file.codeFormat' ) } ${ erroredCodes[0] }` )

                }

                // Validated and sanetised codes
                log( 'Sanetised codes: ', data )
                if( !data.length ) throw new Error( `${ t( 'eventCreate.file.noCodes' ) }` )
                if( !cancelled ) setCodes( data )

                // Load event data based on codes
                const formatedCode = data[0]?.trim()
                log( `Getting data based on code:`, formatedCode )
                const { data: { event, error } } = await getEventDataFromCode( formatedCode )
                log( 'Code data received ', event, error )
                if( error ) throw new Error( error )
                if( !event ) throw new Error( `${ t( 'eventCreate.event.eventExpired' ) }` )

                // Set event details to state
                log( `Computed event`, event )
                setName( event.name )
                setDropId( event.id )
                setEvent( event )
                if( event.expiry_date ) {

                    const [ day, monthName, year ] = event.expiry_date.split( '-' )
                    const endDate = `${ year }-${ monthNameToNumber( monthName ) }-${ day.length == 1 ? `0${ day }` : day }`
                    log( `Computed end date from ${ event.expiry_date }: `, endDate )
                    setDate( endDate )

                }

                if( !cancelled ) setLoading( false )

            } catch ( e ) {

                log( 'Validation error ', e, ' for ', csv )
                if( !cancelled ) setCodes( undefined )
                if( !cancelled ) setLoading( false )
                if( !cancelled ) setCsv( undefined )
                if( !cancelled ) setEvent( '' )
                
                return alert( e.message )

            }

        } )(  )

        return () => cancelled = true

    }, [ csv ] )

    // ///////////////////////////////
    // Component functions
    // ///////////////////////////////
    async function parseCsv( file ) {
        return new Promise( ( resolve, reject ) => {

            // parse csv
            Papa.parse( file, {

                // Assuming it is a newline delimited file, the first entry of each line is the code
                complete: ( { data } ) => resolve( data.map( line => line[0] ) ),
                error: err => reject( err )
            } )

        } )
    }

    async function createEvent( ) {

        try {

            // Health noti
            if( !isHealthy ) {
                const ignore_unhealthy = confirm( `${ t( 'messaging.health.maintenance' ) }` )
                if( !ignore_unhealthy ) throw new Error( `${ t( 'eventCreate.event.eventCancelled' ) }` )
            }

            // Validations
            if( !codes.length ) throw new Error( `${ t( 'eventCreate.file.csvNoEntries' ) }` )
            if( !name.length ) throw new Error( `${ t( 'eventCreate.event.noName' ) }` )
            if( !email.includes( '@' ) ) throw new Error( `${ t( 'eventCreate.event.noEmail' ) }` )
            if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( `${ t( 'eventCreate.event.wrongDate' ) }` )

            // Confirm date
            const confirmed = confirm( `${ t( 'eventCreate.event.creationMessage' , { name: name, email: email } ) } ${ new Date( date ).toLocaleDateString() } (${ new Date( date ) })` )
            log( 'Confirmation status: ', confirmed )
            if( !confirmed ) throw new Error( `${ t( 'eventCreate.event.eventCancelled' ) }` )

            // Call the cloud importer
            setLoading( `${ t( 'eventCreate.creatingDispenser' ) }` )

            // Create remote event
            const event_data = {
                name,
                email,
                date,
                codes,
                dropId,
                // If naiveMode is true skip game, else check if gameEnabled 
                challenges: [ abuseProtection ] ,
                collect_emails: collectEmails === 'yes',
                // Custom base URLs may only be used is collectEmails is off, this is because collectEmails works by setting the base url in Claim.js
                ...collectEmails == 'no' && customBaseurl && { claim_base_url: customBaseurl } ,
                game_config: { duration: gameDuration, target_score: Math.ceil( gameDuration / 5 ) },
                ... css && { css } 
            }
            log( 'Creating event with data: ', JSON.stringify( event_data, null, 2 ) )
            const { data: newEvent } = await registerEvent( event_data )

            log( 'Event created: ', newEvent, { name, email, date, codes } )
            trackEvent( 'admin_event_create' )

            // Error handling
            if( newEvent.error ) throw new Error( newEvent.error )

            // Send to admin interface
            return navigate( `/event/admin/${ newEvent.id }/${ newEvent.authToken }` )

        } catch ( e ) {

            alert( e.message )
            log( 'Upload error: ', e )
            setLoading( false )

        }
    }

    //
    const clearEvent = () => {
        setCodes( undefined )
        setCsv( undefined )
        setEvent( '' )
    }

    // ///////////////////////////////
    // Render component
    // ///////////////////////////////

    // Loading rendering
    if( loading ) return <Loading message={ loading } />

    // Nocodes present
    if( !codes ) return <Layout center hide_footer>
        <Section>
            <Container>
                <CardContainer>
                    <H3 align='center'>{ t( 'eventCreate.preCodes.title' ) }</H3>
                    <UploadButton 
                        id="event-create-file" 
                        label={ t( 'eventCreate.input.label' ) } 
                        toolTip={ t( 'eventCreate.input.info' ) } 
                        accept="text/csv, text/plain" 
                        onFileChange={ ( file ) => setCsv( file ) }
                        required
                    />
                </CardContainer>
            </Container>
        </Section>
    </Layout>
    
    // Main render
    return <Layout id="event-create-layout-container" hide_background={ codes } hide_footer onClick={ () => setBackgroundTaps( backgroundTaps + 1 ) }>

        <Section padding='var(--spacing-4) 0 var(--spacing-12) 0'>
            <Container width='750px'>
                <br/>
                <H3 align='center' size=''>{ t( 'eventCreate.title' ) }</H3>
    
                <Grid margin={ developer_mode ? '0 auto var(--spacing-12) auto' : '0 auto var(--spacing-12) auto' }>
                    <Row margin='0 0 var(--spacing-4) 0'>
                        <Col>
                            <CardDashboard codes={ codes.length } event={ currentEvent } />
                        </Col>
                        
                    </Row>

                    { /* <Modal showClose>
                        <p>Modal is active</p>
                    </Modal> */ }

                    <Row gap='1rem'>
                        <Col size={ 8 }>
                            <Input disabled label={ t( 'eventCreate.form.fileName.label' ) } value={ filename } margin='0 0 var(--spacing-3) 0'/>
                        </Col>
                        { isMobile ? '' : <Col size={ 1 } justify='flex-end'>
                            <Button size='small' onClick={ clearEvent } variation='white' tabIndex='0' margin='0 0 var(--spacing-4) 0'>Switch</Button>
                        </Col> }

                    </Row>
                    <Row>
                        <Col size={ 1 }>
                            <Input disabled label={ t( 'eventCreate.form.codesAmount.label' ) } value={ codes.length } margin='0 0 var(--spacing-6) 0' width='66px'/>
                        </Col>
                    </Row>
                    <Input id="event-create-name" onChange={ ( { target } ) => setName( target.value ) } placeholder={ t( 'eventCreate.form.dropName.placeholder' ) } label={ t( 'eventCreate.form.dropName.label' ) } toolTip={ t( 'eventCreate.form.dropName.info' ) } value={ name } optional />
                    
                    { /* Sam asked to remove the Kiosk expiry, for now I'm hiding it in the prod frontend but am keeping the backend logic in case we need to revert */ }
                    { dev || developer_mode ? <Input id="event-create-date" onChange={ ( { target } ) => setDate( target.value ) } pattern="\d{4}-\d{2}-\d{2}" min={ dateOnXDaysFromNow( 1 ) } type='date' label={ t( 'eventCreate.form.dropDate.label' ) } toolTip={ `${ t( 'eventCreate.form.dropDate.info' ) }` } value={ date } /> : null }
                    
                    <Input id="event-create-email" onChange={ ( { target } ) => setEmail( target.value ) } placeholder={ t( 'eventCreate.form.dropEmail.placeholder' ) } label={ t( 'eventCreate.form.dropEmail.label' ) } toolTip={ t( 'eventCreate.form.dropEmail.info' ) } value={ email } />
                    <Select id="event-create-game-enabled" label={ t( 'eventCreate.form.dropGame.label' ) } toolTip={ `${ t( 'eventCreate.form.dropGame.info' ) }` } options={ gameOptions } onChange={ ( event ) => setAbuseProtection( event.target.value ) } />
                    { abuseProtection === 'game' && <Select id="event-create-game-duration" onChange={ (  event  ) => setGameDuration( event.target.value ) } label={ t( 'eventCreate.gameTime.label' ) } toolTip={ t( 'eventCreate.gameTime.info' ) } options={ t( 'eventCreate.gameTime.options', { returnObjects: true } ) } /> }
                    { developer_mode && <Input highlight={ !css } id="event-create-css" onChange={ ( { target } ) => setCss( target.value ) } placeholder={ t( 'eventCreate.form.dropCss.placeholder' ) } label={ t( 'eventCreate.form.dropCss.label' ) } toolTip={ t( 'eventCreate.form.dropCss.info' ) } value={ css || '' } /> }
                    { developer_mode && <Select options={ email_collect_options } id="event-create-collect-emails" onChange={ ( event ) => setCollectEmails( event.target.value ) }  label={ t( 'eventCreate.form.dropCollectEmails.label' ) } toolTip={ t( 'eventCreate.form.dropCollectEmails.info' ) } />  }
                    { developer_mode && collectEmails == 'no' && <Input highlight={ !customBaseurl } id="event-create-custom-baseurl" onChange={ ( { target } ) => setCustomBaseurl( target.value ) } placeholder={ t( 'eventCreate.form.dropBaseurl.placeholder' ) } label={ t( 'eventCreate.form.dropBaseurl.label' ) } toolTip={ t( 'eventCreate.form.dropBaseurl.info' ) } value={ customBaseurl }/> }
                </Grid>
                <FormFooter>
                    <Button onClick={ clearEvent } variation='white' tabIndex='0'>Cancel</Button>
                    { codes && <Button id="event-create-submit" onClick={ createEvent } tabIndex='0'>{ t( 'eventCreate.form.submitBtn', { count: codes.length } ) }</Button> }
                </FormFooter>
            </Container>
        </Section>
    </Layout>
}
