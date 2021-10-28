import './App.css'
import ViewQR from './components/view-qr'
import Admin from './components/admin'

import React from 'react'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'

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
