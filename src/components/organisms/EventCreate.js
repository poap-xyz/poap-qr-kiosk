import { useState, useEffect } from 'react'

// Components
import Loading from '../molecules/Loading'
import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Input from '../atoms/Input'
import Main from '../atoms/Main'

// Functionality
import { registerEvent, event } from '../../modules/firebase'
import { log, dateOnXDaysFromNow } from '../../modules/helpers'
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
  const [ email, setEmail ] = useState( '' )
  const [ date, setDate ] = useState( '' )
  const [ name, setName ] = useState( '' )
  const [ csv, setCsv ] = useState(  )
  const [ codes, setCodes ] = useState(  )
  const [ loading, setLoading ] = useState( false )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // File validations and loading
  useEffect( f => {

    if( !csv ) return

    ( async f => {

      try {

        // Validations
        const { name } = csv
        if( !name.includes( '.csv' ) && !name.includes( '.txt' ) ) throw new Error( 'File is not a csv/txt' )

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
        setCodes( data )


      } catch( e ) {

        log( 'Validation error ', e, ' for ', csv )
        setCsv( undefined )
        setCodes( undefined )
        return alert( e.message )

      }

    } )(  )

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

      // Validations
      if( !codes.length ) throw new Error( 'Csv has 0 entries' )
      if( !name.length ) throw new Error( 'Please specify an event name' )
      if( !email.includes( '@' ) ) throw new Error( 'Please specify a valid email address' )
      if( !date.match( /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/ ) ) throw new Error( 'Please specify the date in YYYY-MM-DD, for example 2021-11-25' )

      // Confirm date
      const confirmed = confirm( `Please confirm that this is correct:\n\nEvent name: ${ name }\n\nAdministrator email: ${ email }\n\nEvent expires at: ${ date } (${ new Date( date ) })` )
      log( 'Confirmation status: ', confirmed )
      if( !confirmed ) throw new Error( `Event creation cancelled.` )

      // Call the cloud importer
      setLoading( 'Creating event' )

      // Create remote event
      const { data: newEvent } = await registerEvent( { name, email, date, codes } )
      log( 'Event created: ', newEvent, { name, email, date, codes } )
      event( 'admin_code_import' )

      // Error handling
      if( newEvent.error ) throw new Error( newEvent.error )

      // Send to admin interface
      history.push( `/event/admin/${ newEvent.id }/${ newEvent.authToken }` )

    } catch( e ) {

      alert( e.message )
      log( 'Upload error: ', e )

    } finally {
      setLoading( false )
    }


  }

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////
  if( loading ) return <Loading message={ loading } />
  
  return <Container>

    <Main>

      <Input onChange={ ( { target } ) => setName( target.value ) } placeholder='Best launch party ever' label="Event name" info="For your own reference, not visible to the world." value={ name } />
      <Input onChange={ ( { target } ) => setEmail( target.value ) } placeholder='revered@organizer.com' label="Your email" info="We will send the QR kiosk link and the admin link there." value={ email } />
      <Input onChange={ ( { target } ) => setDate( target.value ) } required pattern="\d{4}-\d{2}-\d{2}" min={ dateOnXDaysFromNow( 1 ) } max={ dateOnXDaysFromNow( 30 ) } type='date' label="Event end date" info={ `After this date your QR kiosk will stop working in your local timezone.\n\n⚠️ You can only schedule up to 30 days in advance.` } value={ date } />

      { !codes && <Input 
        label="Select .txt file with codes"
        onChange={ ( { target } ) => setCsv( target.files[0] ) } type='file'
      /> }

      { codes && <Button onClick={ createEvent }>Create event with { codes.length } codes</Button> }
      { codes && <Button color='hint' onClick={ f => setCodes( null ) }>Upload different codes</Button> }
    </Main>

  </Container>

}
