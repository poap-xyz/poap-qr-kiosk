import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Papa from 'papaparse'

// Components
import { Button, CardContainer, Container, H2, H3, Input, Dropdown } from '@poap/poap-components'
import Loading from '../molecules/Loading'
import ViewWrapper from '../molecules/ViewWrapper'
import Layout from '../molecules/Layout'

// Functionality
import { registerEvent, trackEvent, getEventDataFromCode, health_check } from '../../modules/firebase'
import { log, dateOnXDaysFromNow, monthNameToNumber, dev } from '../../modules/helpers'


import Section from '../atoms/Section'
import FormFooter from '../molecules/FormFooter'
import { Col, Grid, Row } from '../atoms/Grid'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function Admin( ) {

    // i18next hook
    const { t } = useTranslation()
    
    // Options store
    const options = t( 'EventCreate.form.dropGame.options' )
    const firstOptionLabel = options && options.length > 0 ? options[0].label : undefined

    // Navigation
    const navigate = useNavigate(  )

    // ///////////////////////////////
    // State handling
    // ///////////////////////////////
    const [ email, setEmail ] = useState( dev ? 'mentor@poap.io' : '' )
    const [ date, setDate ] = useState( '' )
    const [ name, setName ] = useState( '' )
    const [ csv, setCsv ] = useState(  )
    const [ css, setCss ] = useState(  )
    const [ customBaseurl, setCustomBaseurl ] = useState(  )
    const [ codes, setCodes ] = useState(  )
    const [ gameEnabled, setGameEnabled ] = useState( false )
    const [ gameDuration, setGameDuration ] = useState( 30 )
    const [ loading, setLoading ] = useState( false )
    const [ filename, setFilename ] = useState( 'codes.txt' )
    const [ isHealthy, setIsHealthy ] = useState( true )
    const [ backgroundTaps, setBackgroundTaps ] = useState( 0 )
    const [ collectEmails, setCollectEmails ] = useState( false )
    const developer_mode = backgroundTaps >= 20
    

    // ///////////////////////////////
    // Form handling
    // ///////////////////////////////

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
                setLoading( `${ t( 'EventCreate.file.mintCheck' ) }` )

                // Validations
                const { name } = csv
                if( !name.includes( '.csv' ) && !name.includes( '.txt' ) ) throw new Error( `${ t( 'EventCreate.file.acceptedFormat' ) }` )

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
                    throw new Error( `${ erroredCodes.length } ${ t( 'EventCreate.file.codeFormat' ) } ${ erroredCodes[0] }` )

                }

                // Validated and sanetised codes
                log( 'Sanetised codes: ', data )
                if( !data.length ) throw new Error( `${ t( 'EventCreate.file.noCodes' ) }` )
                if( !cancelled ) setCodes( data )

                // Load event data based on codes
                const formatedCode = data[0]?.trim()
                const { data: { event, error } } = await getEventDataFromCode( formatedCode )
                log( 'Code data received ', event, error )
                if( error ) throw new Error( error )
                if( !event ) throw new Error( `${ t( 'EventCreate.form.eventExpired' ) }` )

                // Set event details to state
                if( event.name ) setName( event.name )
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
                const ignore_unhealthy = confirm( `${ t( 'health.maintenance', { ns: 'dispenser' } ) }` )
                if( !ignore_unhealthy ) throw new Error( `${ t( 'EventCreate.form.eventCancelled' ) }` )
            }

            // Validations
            if( !codes.length ) throw new Error( `${ t( 'EventCreate.file.csvNoEntries' ) }` )
            if( !name.length ) throw new Error( `${ t( 'EventCreate.form.noName' ) }` )
            if( !email.includes( '@' ) ) throw new Error( `${ t( 'EventCreate.form.noEmail' ) }` )
            if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( `${ t( 'EventCreate.form.wrongDate' ) }` )

            // Confirm date
            const confirmed = confirm( `${ t( 'EventCreate.form.creationMessage' , { name: name, email: email } ) } ${ new Date( date ).toLocaleDateString() } (${ new Date( date ) })` )
            log( 'Confirmation status: ', confirmed )
            if( !confirmed ) throw new Error( `${ t( 'EventCreate.form.eventCancelled' ) }` )

            // Call the cloud importer
            setLoading( `${ t( 'EventCreate.creatingDispenser' ) }` )

            // Create remote event
            const { data: newEvent } = await registerEvent( {
                name,
                email,
                date,
                codes,
                challenges: gameEnabled ? [ 'game' ] : [],
                collect_emails: !!collectEmails,
                // Custom base URLs may only be used is collectEmails is off, this is because collectEmails works by setting the base url in Claim.js
                ... !collectEmails && customBaseurl && { claim_base_url: customBaseurl } ,
                game_config: { duration: gameDuration, target_score: Math.ceil( gameDuration / 5 ) },
                ... css && { css } 
            } )

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
                    <H3 align='center'>{ t( 'EventCreate.preCodes.title' ) }</H3>
                    <Input
                        highlight={ !codes } 
                        id="event-create-file"
                        label={ t( 'EventCreate.input.label' ) }
                        info={ t( 'EventCreate.input.info' ) }
                        accept=".csv,.txt"
                        title={ csv && codes && `[ ${ filename } ] - ${ t( 'EventCreate.file.codesDetected' , { count: codes.length } ) }` }
                        onClick={ !filename ? undefined : () => setCsv( undefined ) }
                        onChange={ ( { target } ) => setCsv( target.files[0] ) } type='file'
                        required
                    />
                </CardContainer>
            </Container>
        </Section>
    </Layout>
    
    // Main render
    return <Layout hide_background={ codes } hide_footer onClick={ () => setBackgroundTaps( backgroundTaps + 1 ) }>

        <Section>
            <Container width='750px'>
                <br/>
                <H3 align='center'>{ t( 'EventCreate.title' ) }</H3>

                <Grid>
                    <Row>
                        <Input
                            highlight={ !codes } 
                            id="event-create-file"
                            label={ t( 'EventCreate.input.label' ) }
                            info={ t( 'EventCreate.input.info' ) }
                            accept=".csv,.txt"
                            title={ csv && codes && `[ ${ filename } ] - ${ t( 'EventCreate.file.codesDetected' , { count: codes.length } ) }` }
                            onClick={ !filename ? undefined : () => setCsv( undefined ) }
                            onChange={ ( { target } ) => setCsv( target.files[0] ) } type='file'
                            disabled
                        />
                    </Row>
                    <Row>
                        <Col size={ 1 }>
                            <Input disabled label={ t( 'EventCreate.form.codesAmount.label' ) } value={ codes.length } width='66px'/>
                        </Col>
                    </Row>
                    <Input id="event-create-name" onChange={ ( { target } ) => setName( target.value ) } placeholder={ t( 'EventCreate.form.dropName.placeholder' ) } label={ t( 'EventCreate.form.dropName.label' ) } toolTip={ t( 'EventCreate.form.dropName.info' ) } value={ name } optional />
                    <Input id="event-create-date" onChange={ ( { target } ) => setDate( target.value ) } pattern="\d{4}-\d{2}-\d{2}" min={ dateOnXDaysFromNow( 1 ) } type='date' label={ t( 'EventCreate.form.dropDate.label' ) } toolTip={ `${ t( 'EventCreate.form.dropDate.info' ) }` } value={ date } />
                    <Input id="event-create-email" onChange={ ( { target } ) => setEmail( target.value ) } placeholder={ t( 'EventCreate.form.dropEmail.placeholder' ) } label={ t( 'EventCreate.form.dropEmail.label' ) } toolTip={ t( 'EventCreate.form.dropEmail.info' ) } value={ email } />
                    <Dropdown id="event-create-game-enabled" onChange={ ( { target } ) => setGameEnabled( target.value.toLowerCase().includes( 'yes' ) ) } label={ t( 'EventCreate.form.dropGame.label' ) } toolTip={ `${ t( 'EventCreate.form.dropGame.info' ) }` } options={ t( 'EventCreate.form.dropGame.options', { returnObjects: true } ) }/>
                    { gameEnabled && <Dropdown id="event-create-game-duration" onChange={ ( { target } ) => setGameDuration( target.value ) } label={ t( 'EventCreate.form.gameTime.label' ) } toolTip={ t( 'EventCreate.form.gameTime.info' ) } options={ t( 'EventCreate.form.gameTime.options', { returnObjects: true } ) } /> }
                    { developer_mode && <Input highlight={ !css } id="event-create-css" onChange={ ( { target } ) => setCss( target.value ) } placeholder={ t( 'EventCreate.form.dropCss.placeholder' ) } label={ t( 'EventCreate.form.dropCss.label' ) } toolTip={ t( 'EventCreate.form.dropCss.info' ) } value={ css || '' } /> }
                    { developer_mode && <Dropdown options={ t( 'EventCreate.form.dropCollectEmails.options', { returnObjects: true } ) } id="event-create-collect-emails" onChange={ ( { target } ) => setCollectEmails( target.value.includes( 'yes' ) ) }  label={ t( 'EventCreate.form.dropCollectEmails.label' ) } toolTip={ t( 'EventCreate.form.dropCollectEmails.info' ) } value={ collectEmails } /> }
                    { developer_mode && !collectEmails && <Input highlight={ !customBaseurl } id="event-create-custom-baseurl" onChange={ ( { target } ) => setCustomBaseurl( target.value ) } placeholder={ t( 'EventCreate.form.dropBaseurl.placeholder' ) } label={ t( 'EventCreate.form.dropBaseurl.label' ) } toolTip={ t( 'EventCreate.form.dropBaseurl.info' ) } value={ customBaseurl || '' } /> }
                </Grid>

                <FormFooter>
                    <Button variation='white'>Cancel</Button>
                    { codes && <Button id="event-create-submit"  onClick={ createEvent } tabIndex='0'>{ t( 'EventCreate.form.submitBtn', { count: codes.length } ) }</Button> }
                </FormFooter>
                <br/><br/><br/><br/>
            </Container>
        </Section>
    </Layout>
}
