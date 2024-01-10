import { Text, Container } from '@poap/poap-components'
import ViewWrapper from './ViewWrapper'
import Section from '../atoms/Section'
import POAPSpinner from '../atoms/POAPSpinner'


export default function LoadingScreen( { children, message, generic_loading_styles, className, ...props } ) {


    return <ViewWrapper center className={ `${ className } loading_container` } generic_loading_styles={ generic_loading_styles }  { ...props }>

        <Section>
            <Container { ...props }>
                <POAPSpinner />
                { message && <Text margin="2rem 0" id='loading_text' align="center">{ message }</Text> }
                { children }
            </Container>
        </Section>

    </ViewWrapper> 
}