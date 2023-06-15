import styled from 'styled-components'
import { useRive, Layout as RiveLayout, Fit, Alignment } from '@rive-app/react-canvas'

import { Text, Container } from '@poap/poap-components'
import ViewWrapper from '../atoms/ViewWrapper'
import Section from '../atoms/Section'

const RiveWrapper = styled.div`
    margin: 0 auto;
    width: 200px;
    height: 200px;
`

export default function LoadingScreen( { children, message, generic_loading_styles, className, ...props } ) {

    const { RiveComponent: POAPSpinner } = useRive( {
        src: '/assets/rive/poap_logo_loader.riv',
        autoplay: true,
        stateMachines: 'statemachine_staticloader',
        layout: new RiveLayout( {
            fit: Fit.Cover,
            alignment: Alignment.Center
        } )
    } )

    return <ViewWrapper center className={ `${ className } loading_container` } generic_loading_styles={ generic_loading_styles }  { ...props }>

        <Section>
            <Container { ...props }>
                <RiveWrapper>
                    { POAPSpinner && <POAPSpinner /> }
                </RiveWrapper>
                { message && <Text margin="2rem 0" id='loading_text' align="center">{ message }</Text> }
                { children }
            </Container>
        </Section>

    </ViewWrapper> 
}