import './App.css'
import logo from './logo.svg'
import ViewQR from './components/view-qr'
import Admin from './components/admin'

import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { log } from './modules/helpers'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function App( ) {

  return <Router>
    
    <Switch>
      
      <Route path='/admin' component={ Admin } />
      <Route path='/' component={ ViewQR } />


    </Switch>

  </Router>

}
