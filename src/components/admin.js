import logo from '../logo.svg'

import React, { useState, useEffect } from 'react'
import { Container, Loading } from './generic'
import { importCodesFromArray, event } from '../modules/firebase'
import { log } from '../modules/helpers'
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
  const [ password, setPassword ] = useState( '' )
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
        const data = await parseCsv( csv )
        log( 'Codes loaded: ', data )
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

  async function importCodes( ) {

    try {

      if( !password ) throw new Error( 'Please provide the password' )
      if( !codes.length ) throw new Error( 'Csv has 0 entries' )

      // Call the cloud importer
      setLoading( 'Importing codes' )
      await importCodesFromArray( password, codes )
      alert( 'Import success! Forwarding you to the main interface' )
      event( 'admin_code_import' )
      history.push( '/' )

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
    <img id='logo' src={ logo } />
    <input id="password" onChange={ ( { target } ) => setPassword( target.value ) } type='password' placeholder='Password' value={ password } />

    { !codes && <div id="fileupload">
          
        <label htmlFor="file">Select csv file with codes</label>
        <input id='file' onChange={ ( { target } ) => setCsv( target.files[0] ) } type='file' />
  
      </div> }

    { codes && <button id="uploadcodes" className='button' onClick={ importCodes }>Upload { codes.length } codes</button> }
  </Container>

}
