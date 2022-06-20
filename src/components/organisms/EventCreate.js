import { useState, useEffect } from 'react'

// Components
import Loading from '../molecules/Loading'
import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Input from '../atoms/Input'
import Main from '../atoms/Main'

// Functionality
import { registerEvent, trackEvent, getEventDataFromCode, health_check } from '../../modules/firebase'
import { log, dateOnXDaysFromNow, monthNameToNumber, dev } from '../../modules/helpers'
import Papa from 'papaparse'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function Admin( ) {



  const navigate = useNavigate(  )

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const [ email, setEmail ] = useState( dev ? 'mentor@poap.io' : '' )
  const [ date, setDate ] = useState( '' )
  const [ name, setName ] = useState( '' )
  const [ csv, setCsv ] = useState(  )
  const [ codes, setCodes ] = useState(  )
  const [ gameEnabled, setGameEnabled ] = useState( false )
  const [ gameDuration, setGameDuration ] = useState( 30 )
  const [ loading, setLoading ] = useState( false )
  const [ filename, setFilename ] = useState( 'codes.txt' )
  const [ isHealthy, setIsHealthy ] = useState( true )

  const { t } = useTranslation( [ 'eventCreate', 'dispenser' ] )

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

  // File validations and loading
  useEffect( f => {

    let cancelled = false

    if( !csv ) return

    ( async f => {

      try {

        // Loading animation
        setLoading( `${ t( 'file.mintCheck' )}` )

        // Validations
        const { name } = csv
        if( !name.includes( '.csv' ) && !name.includes( '.txt' ) ) throw new Error( `${ t( 'file.acceptedFormat' )}` )

        // Set filename to state
        setFilename( name )

        // Load csv data
        let data = await parseCsv( csv )
        log( 'Raw codes loaded: ', data )

        // Remove website prefix
        data = data.map( code => code.replace( /(https?:\/\/.*\/)/ig, '' ) )

        // Take out empty lines
        data = data.filter( code => code.length != 0 )

        // Find faulty codes
        const erroredCodes = data.filter( code => !code.match( /\w{1,42}/ )  )

        // Let user know about faulty codes
        if( erroredCodes.length ) {

          log( 'Errored codes: ', erroredCodes )
          throw new Error( `${ erroredCodes.length } ${ t( 'file.codeFormat' )} ${ erroredCodes[0] }` )

        }

        // Validated and sanetised codes
        log( 'Sanetised codes: ', data )
        if( !data.length ) throw new Error( `${ t( 'file.noCodes' )}` )
        if( !cancelled ) setCodes( data )

        // Load event data based on codes
        const { data: { event, error } } = await getEventDataFromCode( data[0] )
        log( 'Code data received ', event, error )
        if( error ) throw new Error( error )
        if( !event ) throw new Error( `${ t( 'event.eventExpired' ) }` )

        // Set event details to state
        if( event.name ) setName( event.name )
        if( event.expiry_date ) {

          const [ day, monthName, year ] = event.expiry_date.split( '-' )
          const endDate = `${year}-${monthNameToNumber( monthName )}-${ day.length == 1 ? `0${ day }` : day }`
          log( `Computed end date from ${event.expiry_date}: `, endDate )
          setDate( endDate )
          
        }

        if( !cancelled ) setLoading( false )

      } catch( e ) {

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
        const ignore_unhealthy = confirm( `${ t( 'health.maintenanceApi' ) }` )
        if( !ignore_unhealthy ) throw new Error( `${ t( 'event.eventCancelled' ) }` )
      }

      // Validations
      if( !codes.length ) throw new Error( `${ t( 'file.csvNoEntries' ) }` )
      if( !name.length ) throw new Error( `${ t( 'event.noName' ) }` )
      if( !email.includes( '@' ) ) throw new Error( `${ t( 'event.noEmail' ) }` )
      if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( `${ t( 'event.wrongDate' ) }` )

      // Confirm date
      const confirmed = confirm( `${ t( 'event.creationMessage' , { name: name, email: email } ) } ${ new Date( date ).toLocaleDateString() } (${ new Date( date ) })` )
      log( 'Confirmation status: ', confirmed )
      if( !confirmed ) throw new Error( `${ t( 'event.eventCancelled' ) }` )

      // Call the cloud importer
      setLoading( `${ t( 'creatingDispenser' ) }` )

      // Create remote event
      const { data: newEvent } = await registerEvent( {
        name,
        email,
        date,
        codes,
        challenges: gameEnabled ? [ 'game' ] : [],
        game_config: { duration: gameDuration, target_score: Math.ceil( gameDuration / 5 ) }
      } )

      log( 'Event created: ', newEvent, { name, email, date, codes } )
      trackEvent( 'admin_event_create' )

      // Error handling
      if( newEvent.error ) throw new Error( newEvent.error )

      // Send to admin interface
      return navigate( `/event/admin/${ newEvent.id }/${ newEvent.authToken }` )

    } catch( e ) {

      alert( e.message )
      log( 'Upload error: ', e )
      setLoading( false )

    }


  }

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////
  if( loading ) return <Loading message={ loading } />
  
  return <Container>

    <Main width='400px'>

      <Input
        highlight={ !codes } 
        id="event-create-file"
        label={ t( 'input.label' ) }
        info={ t( 'input.info' )}
        accept=".csv,.txt"
        title={ csv && codes && `[ ${filename} ] - ${ t( 'file.codesDetected' , { count: codes.length } ) }` }
        onClick={ !filename ? undefined : () => setCsv( undefined ) }
        onChange={ ( { target } ) => setCsv( target.files[0] ) } type='file'
      />

      { codes && <>
        <Input highlight={ !name } id="event-create-name" onChange={ ( { target } ) => setName( target.value ) } placeholder={ t( 'event.dropName.placeholder' ) } label={ t( 'event.dropName.label' ) } info={ t( 'event.dropName.info' ) } value={ name } />
        <Input highlight={ !date } id="event-create-date" onChange={ ( { target } ) => setDate( target.value ) } required pattern="\d{4}-\d{2}-\d{2}" min={ dateOnXDaysFromNow( 1 ) } type='date' label={ t( 'event.dropDate.label' ) } info={ `${ t( 'event.dropDate.info' ) }` } value={ date } />
        <Input highlight={ !email } id="event-create-email" onChange={ ( { target } ) => setEmail( target.value ) } placeholder={ t( 'event.dropEmail.placeholder' ) } label={ t( 'event.dropEmail.label' ) } info={ t( 'event.dropEmail.info' ) } value={ email } />
        <Input id="event-create-game-enabled" onChange={ ( { target } ) => setGameEnabled( target.value.toLowerCase().includes( 'yes' ) ) } label={ t( 'event.dropGame.label' ) } info={ `${ t( 'event.dropGame.info' ) }` } type='dropdown' options={ t( 'event.dropGame.options', { returnObjects: true } ) } />
        { gameEnabled && <Input id="event-create-game-duration" type="dropdown" onChange={ ( { target } ) => setGameDuration( target.value ) } label={ t( 'event.gameTime.label' ) } info={ t( 'event.gameTime.info' ) } options={ t( 'event.gameTime.options', { returnObjects: true } ) } /> }
      </> }
      
      { codes && <Button id="event-create-submit" onClick={ createEvent }>{ t( 'event.eventCreate', { count: codes.length } ) }</Button> }
      { /* codes && <Button id="event-create-reset" color='hint' onClick={ f => setCodes( null ) }>Upload different codes</Button> */ }
    </Main>

  </Container>

}
