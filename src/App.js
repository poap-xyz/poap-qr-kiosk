// Providers
import Theme from './components/atoms/Theme'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'

// Pages
import ViewQR from './components/organisms/EventView'
import CreateEvent from './components/organisms/EventCreate'
import Welcome from './components/organisms/Welcome'
import EventAdmin from './components/organisms/EventAdmin'
import Claim from './components/organisms/Claim'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function App( ) {

  return <Theme>
    <Router>

      <Switch>

        <Route exact path='/' component={ Welcome } />
        <Route exact path='/create' component={ CreateEvent } />
        <Route path='/event/admin/:eventId/:authToken' component={ EventAdmin } />
        <Route path='/event/:eventId?/:viewMode?' component={ ViewQR } />
        <Route path='/claim/:claimCode' component={ Claim } />


      </Switch>

    </Router>
  </Theme>

}
