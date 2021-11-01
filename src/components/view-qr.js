import logo from '../logo.svg'

import React, { useState, useEffect } from 'react'
import { Container, Loading } from './generic'
import { listenToCode, markCodeClaimed, event } from '../modules/firebase'
import QRCode from 'react-qr-code'
import { log } from '../modules/helpers'
import { useHistory } from 'react-router-dom'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

  const history = useHistory()

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const [ code, setCode ] = useState( false )
  const [ loading, setLoading ] = useState( true )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Start code listener
  useEffect( f => listenToCode( newCode => {
    setCode( newCode.id )
    if( newCode.id ) setLoading( false )
  } ), [] )

  // No code timeout
  useEffect( f => {

    // If there is a code, do nothing
    if( code?.length ) return


    // If there is no code, after a delay take away the loading indicator
    const maxWaitForCode = 5000
    setTimeout( f => setLoading( false ), maxWaitForCode )

  }, [ code ] )

  // ///////////////////////////////
  // Component functions
  // ///////////////////////////////
  async function nextCode(  ) {
    log( `Marking ${ code } as claimed` )
    setLoading( 'Getting next code' )
    await markCodeClaimed( code )
    event( 'user_request_next_qr' )
  }

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////

  // loading screen
  if( loading ) return <Loading message={ loading } />

  // No code error
  if( !code ) return <Container>
  
    <img id='logo' src={ logo } />
    <h1>No codes available</h1>
    <p onClick={ f => history.push( '/admin' ) } className='sidenote'>If you just uploaded new ones, give the backend a minute to catch up. If nothing happens for a while, click here to open the admin interface.</p>
    
  </Container>
  
  // Display QR
  return <Container>
    <img id='logo' src={ logo } />
    <QRCode value={ `https://poap-qr-kiosk.web.app/claim/${ code }` } />
    <button onClick={ nextCode }>Next code</button>
  </Container>

}
