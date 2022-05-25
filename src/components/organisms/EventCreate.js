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
import { useHistory } from 'react-router-dom'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function Admin( ) {

  const history = useHistory(  )

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
          if( !health.healthy ) {
            setIsHealthy( false )
            return alert( `The POAP system is undergoing some maintenance, the QR dispenser might not work as expected during this time.\n\nPlease check our official channels for details.` )
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
        setLoading( `Checking your mint links` )

        // Validations
        const { name } = csv
        if( !name.includes( '.csv' ) && !name.includes( '.txt' ) ) throw new Error( 'File is not a csv/txt' )

        // Set filename to state
        setFilename( name )

        // Load csv data
        let data = await parseCsv( csv )
        log( 'Raw codes loaded: ', data )

        // Remove website prefix
        data = data.map( code => code.replace( /(https?:\/\/.*\/)/ig, '') )

        // Take out empty lines
        data = data.filter( code => code.length != 0 )

        // Find faulty codes
        const erroredCodes = data.filter( code => !code.match( /\w{1,42}/ )  )

        // Let user know about faulty codes
        if( erroredCodes.length ) {

          log( 'Errored codes: ', erroredCodes )
          throw new Error( `${ erroredCodes.length } codes had an invalid format. Example of a malformed code: ${ erroredCodes[0] }` )

        }

        // Validated and sanetised codes
        log( 'Sanetised codes: ', data )
        if( !data.length ) throw new Error( `No codes in the file you selected` )
        if( !cancelled ) setCodes( data )

        // Load event data based on codes
        const { data: { event, error } } = await getEventDataFromCode( data[0] )
        log( 'Code data received ', event, error )
        if( error ) throw new Error( error )
        if( !event ) throw new Error( `This event appears to have expired!` )

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
        const ignore_unhealthy = confirm( `The POAP API is under maintenance, you can continue but this might cause unexpected behaviour.` )
        if( !ignore_unhealthy ) throw new Error( `Event creation cancelled` )
      }

      // Validations
      if( !codes.length ) throw new Error( 'Csv has 0 entries' )
      if( !name.length ) throw new Error( 'Please specify an event name' )
      if( !email.includes( '@' ) ) throw new Error( 'Please specify a valid email address' )
      if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( 'Please specify the date in YYYY-MM-DD, for example 2021-11-25' )

      // Confirm date
      const confirmed = confirm( `Please confirm that this is correct:\n\nDrop name: ${ name }\n\nAdministrator email: ${ email }\n\nQR dispenser expires at: ${ date } (${ new Date( date ) })` )
      log( 'Confirmation status: ', confirmed )
      if( !confirmed ) throw new Error( `Event creation cancelled.` )

      // Call the cloud importer
      setLoading( 'Creating QR Dispenser' )

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
      return history.push( `/event/admin/${ newEvent.id }/${ newEvent.authToken }` )

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
        label="Select .txt file that contains your POAP mint links"
        info="This is the .txt file you received via email after you created your POAP drop at https://app.poap.xyz/admin"
        accept=".csv,.txt"
        title={ csv && codes && `[ ${filename} ] - ${ codes.length } codes detected.` }
        onClick={ !filename ? undefined : () => setCsv( undefined ) }
        onChange={ ( { target } ) => setCsv( target.files[0] ) } type='file'
      />

      { codes && <>
        <Input highlight={ !name } id="event-create-name" onChange={ ( { target } ) => setName( target.value ) } placeholder='Best launch party ever' label="Drop name" info="For your own reference, not visible to the world." value={ name } />
        <Input highlight={ !date } id="event-create-date" onChange={ ( { target } ) => setDate( target.value ) } required pattern="\d{4}-\d{2}-\d{2}" min={ dateOnXDaysFromNow( 1 ) } type='date' label="QR dispenser expiry date" info={ `After this date in your local timezone, your QR kiosk will stop working\n\n⚠️ You can only schedule up to 30 days in advance.` } value={ date } />
        <Input highlight={ !email } id="event-create-email" onChange={ ( { target } ) => setEmail( target.value ) } placeholder='revered@organizer.com' label="Your email" info="We will send the QR kiosk link and the admin link there." value={ email } />
        <Input id="event-create-game-enabled" onChange={ ( { target } ) => setGameEnabled( target.value.toLowerCase().includes( 'yes' ) ) } label="Enable anti-farming game?" info={ `Especially online events tend to attract malicious POAP farmers (people who just show up to get as many POAPs as they can without being useful participants).\n\nEnabling this setting will force your participants to play a minigame for a minute before being given a POAP.` } type='dropdown' options={ [ 'No (optional for physical events)', 'Yes (recommended for online)' ] } />
        { gameEnabled && <Input id="event-create-game-duration" type="dropdown" onChange={ ( { target } ) => setGameDuration( target.value ) } label="How many seconds should the anti-farming game last?" info="The longer you set this, the harder it becomes for humans to farm your POAP drop" options={ [ 30, 10, 20, 60 ] } /> }
      </> }
      
      { codes && <Button id="event-create-submit" onClick={ createEvent }>Create dispenser with { codes.length } codes</Button> }
      { /* codes && <Button id="event-create-reset" color='hint' onClick={ f => setCodes( null ) }>Upload different codes</Button> */ }
    </Main>

  </Container>

}
