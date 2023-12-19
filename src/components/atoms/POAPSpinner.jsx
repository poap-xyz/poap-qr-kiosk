import styled from 'styled-components'
import { useRive, Layout as RiveLayout, Fit, Alignment } from '@rive-app/react-canvas'


const RiveWrapper = styled.div`
    margin: 0 auto;
    width: ${ ( { size=200 } ) => `${ size }px` };
    height: ${ ( { size=200 } ) => `${ size }px` };
`

export default function POAPSpinner( { ...props } ) {

    // If we are running in Cypress, disable the Rive aspect of the loading screen
    const { RiveComponent: RivePOAPSpinner } = window.Cypress ?  {
        RiveComponent: () => <div className="cypress_loader" />
    }  : useRive( {
        src: '/assets/rive/poap_logo_loader.riv',
        autoplay: true,
        stateMachines: 'statemachine_staticloader',
        layout: new RiveLayout( {
            fit: Fit.Cover,
            alignment: Alignment.Center
        } )
    } )

    return <RiveWrapper { ...props }>
        { RivePOAPSpinner && <RivePOAPSpinner /> }
    </RiveWrapper>
}