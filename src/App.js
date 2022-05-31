// Providers
import { Suspense } from 'react'
import Theme from './components/atoms/Theme'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

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

  return <Suspense fallback={null}>
    <Theme>
      <Router>

        <Routes>

          <Route exact path='/' element={ <Welcome /> } />
          <Route exact path='/create' element={ <CreateEvent /> } />
          <Route path='/event/admin/:eventId/:authToken' element={ <EventAdmin /> } />
          
          <Route path='/event'>

            <Route path=':eventId/:viewMode' element={ <ViewQR /> } />
            <Route path=':eventId' element={ <ViewQR /> } />
            <Route path='' element={ <ViewQR /> } />
            
          </Route>
          
          <Route path='/claim/' >

            <Route path=':challenge_code/:error_code' element={ <Claim /> } />
            <Route path=':challenge_code' element={ <Claim /> } />

          </Route>


        </Routes>

      </Router>
    </Theme>
  </Suspense>
  
}
