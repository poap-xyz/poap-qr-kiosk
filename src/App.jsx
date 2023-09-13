// Providers
import { Suspense } from 'react'
import Theme from './components/atoms/Theme'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

import './modules/i18n'

// Pages
import Homepage from './components/pages/Homepage'
import ViewQR from './components/pages/EventView'
import CreateEvent from './components/pages/EventCreate'
import EventAdmin from './components/pages/EventAdmin'
import Claim from './components/pages/Claim'
import MintPOAP from './components/pages/MintPOAP'
import StaticClaim from './components/pages/StaticClaim'
import StaticAdmin from './components/pages/StaticAdmin'
import StaticCreate from './components/pages/StaticCreate'

// Components
import Loading from './components/molecules/Loading'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function App( ) {

    return <Theme>
    
        <Router>

            <Suspense fallback={ <Loading /> }>

                <Routes>

                    <Route exact path='/' element={ <Homepage /> } />
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

                    <Route path='/mint/:claim_code' element={ <MintPOAP /> } />

                    <Route path='/static/'>

                        <Route path='claim/:claim_code' element={ <StaticClaim /> } />
                        <Route path='admin/export' element={ <StaticAdmin /> } />
                        <Route path='admin/create' element={ <StaticCreate /> } />

                    </Route>

                </Routes>

            </Suspense>

        </Router>
    </Theme>

}

