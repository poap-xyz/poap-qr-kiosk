import logo from '../logo.svg'

import React, { useState, useEffect } from 'react'
import { Container } from './generic'
import { listenToCode, markCodeClaimed, event } from '../modules/firebase'
import QRCode from 'react-qr-code'
import { log } from '../modules/helpers'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ViewQR( ) {

  // ///////////////////////////////
  // State handling
  // ///////////////////////////////
  const [ code, setCode ] = useState( false )
  const [ loading, setLoading ] = useState( false )

  // ///////////////////////////////
  // Lifecycle handling
  // ///////////////////////////////

  // Start code listener
  useEffect( f => listenToCode( code => {
    setCode( code.id )
  } ), [] )

  // ///////////////////////////////
  // Component functions
  // ///////////////////////////////
  async function nextCode(  ) {
    log( `Marking ${ code } as claimed` )
    setLoading( 'Getting next code' )
    await markCodeClaimed( code )
    setLoading( false )
    event( 'user_request_next_qr' )
  }

  // ///////////////////////////////
  // Render component
  // ///////////////////////////////
  if( !code ) return <Container>
  
    <img id='logo' src={ logo } />
    <h1>No codes available</h1>
    <p onClick={ f => history.push( '/admin' ) } className='sidenote'>If you just uploaded new ones, give the backend a minute to catch up. If nothing happens for a while, click here to open the admin interface.</p>
    
  </Container>
  
  return <Container>
    <img id='logo' src={ logo } />
    <QRCode value={ `http://poap.xyz/claim/${ code }` } />
    <button onClick={ nextCode }>Next code</button>
  </Container>

}
