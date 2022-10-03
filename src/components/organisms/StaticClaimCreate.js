import { useRef, useState } from "react"
import { useTranslation } from 'react-i18next'

// Components
import Button from "../atoms/Button"
import Container from "../atoms/Container"
import Input from "../atoms/Input"
import Main from "../atoms/Main"
import Loading from "../molecules/Loading"
import { H1, Text } from "../atoms/Text"
import { create_static_drop } from '../../modules/firebase'
import { log, uuidv4 } from "../../modules/helpers"

export default function StaticClaimCreate() {

    // useTranslation loads the first namespace (example 1) by default and pre caches the second variable, the t hook still needs a reference like example 2.
	// Example 1: Translations for this organism are loaded by i18next like: t( 'key.reference' )
	// Example 2: Translations for sitewide texts are in Namespace 'dispenser' and are loaded like: t( 'key.reference', { ns: 'dispenser' } )
	const { t } = useTranslation( [ 'static' , 'dispenser' ] )

    const [ drop_id, set_drop_id ] = useState( '' )
    const [ optin_text, set_optin_text] = useState( '' )
    const [ welcome_text, set_welcome_text] = useState( '' )
    const [ custom_css, set_custom_css ] = useState( '' )
    const [ custom_email, set_custom_email ] = useState(  )
    const [ allow_wallet_claim, set_allow_wallet_claim ] = useState( false )
    const [ success, set_success] = useState( false )
    const [ loading, set_loading] = useState( false )
    const auth_code = useRef( uuidv4() ).current

    async function create_drop() {

        try {

            set_loading( `${ t( 'create.set_loading' ) }` )
            const { data } = await create_static_drop( { drop_id, auth_code, optin_text, welcome_text, custom_css, custom_email, allow_wallet_claim } )
            log( `Remote response: `, data )
            const { csv_string, error } = data
            if( error ) throw new Error( error || `Malformed response` )
            set_success( true )

        } catch( e ) {
            log( `CSV error: `, e )
            alert( e.message )
        } finally {
            set_loading( false )
        }

    }

    if( loading ) return <Loading message={ loading } />

    if( success ) return <Container>

            <Main align='flex-start' width='600px'>

                <H1>{ t( 'create.succes_screen.title') }</H1>
                <Text>{ t( 'create.succes_screen.steps_title') }</Text>
                <Text>{ t( 'create.succes_screen.first_line' , { code: auth_code } ) }</Text>
                <Text>{ t( 'create.succes_screen.second_line') }</Text>
                <Text>{ t( 'create.succes_screen.third_line') }</Text>
                <Text>{ t( 'create.succes_screen.fourth_line') }</Text>
            </Main>

    </Container>

    return <Container>

        <Main align='flex-start' width='600px'>

            <H1>{ t( 'create.title' ) }</H1>
            <Text>{ t( 'create.note' ) }</Text>
            <Input type='text' value={ drop_id } onChange={ ( { target } ) => set_drop_id( target.value ) } label={ t( 'create.labels.drop_id.label' ) } info={ t( 'create.labels.drop_id.info' ) } />
            <Input type='text' value={ welcome_text } onChange={ ( { target } ) => set_welcome_text( target.value ) } label={ t( 'create.labels.welcome_text.label' ) } info={ t( 'create.labels.welcome_text.info' ) } />
            <Input type='text' value={ optin_text } onChange={ ( { target } ) => set_optin_text( target.value ) } label={ t( 'create.labels.optin_text.label' ) } info={ t( 'create.labels.optin_text.info' ) } />
            <Input type='text' value={ custom_css } onChange={ ( { target } ) => set_custom_css( target.value ) } label='Custom CSS' info='Custom style code that will be injected. This can be used for fonts, logos, adn colors.' />
            <Input type='text' value={ custom_email } onChange={ ( { target } ) => set_custom_email( target.value ) } label='Custom Email HTML' info='Custom email HTML that will be sent instead of the default POAP email.' />
            <Text id='static-print-qr-optin-field' align='flex-start' onClick={ f => set_allow_wallet_claim( !allow_wallet_claim ) } direction='row'>
                <Input style={ { zoom: 1.3 } } margin='0 .5rem 0 0' width='50px' type='checkbox' onChange={ ( { target } ) => set_allow_wallet_claim( target.checked ) } checked={ allow_wallet_claim } />
                
                { /* This allows us to set terms & conditions texts through the firebase entry */ }
                Allow claims by wallet address. This bypasses the collection of emails, allowing you to use the static claim page as a whitelabel claim experience.
            </Text>
            <Button onClick={ create_drop }>{ t( 'create.buttons.create_drop' ) }</Button>

        </Main>

    </Container>
}