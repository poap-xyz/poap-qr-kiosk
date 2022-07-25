import { useRef, useState } from "react"
import Button from "../atoms/Button"
import Container from "../atoms/Container"
import Input from "../atoms/Input"
import Main from "../atoms/Main"
import Loading from "../molecules/Loading"
import { H1, Text } from "../atoms/Text"
import { create_static_drop } from '../../modules/firebase'
import { log, uuidv4 } from "../../modules/helpers"

export default function StaticClaimCreate() {

    const [ drop_id, set_drop_id ] = useState( '' )
    const [ optin_text, set_optin_text] = useState( '' )
    const [ welcome_text, set_welcome_text] = useState( '' )
    const [ success, set_success] = useState( false )
    const [ loading, set_loading] = useState( false )
    const auth_code = useRef( uuidv4() ).current

    async function create_drop() {

        try {

            set_loading( 'Creating drop' )
            const { data } = await create_static_drop( { drop_id, auth_code, optin_text, welcome_text } )
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

                <H1>Creation success</H1>
                <Text>Next steps:</Text>
                <Text>1. Save your authentication code: { auth_code }.</Text>
                <Text>2. Ask for this drop to be approved.</Text>
                <Text>3. Print your physical QRS with the format: https://qr.poap.xyz/#/static/claim/CLAIM_CODE.</Text>
                <Text>4. Export emails after the event at https://qr.poap.xyz/#/static/admin/export</Text>
            </Main>

    </Container>

    return <Container>

        <Main align='flex-start' width='600px'>

            <H1>Static QR Drop Creation</H1>
            <Text>Note: this is an internal POAP tool, anything you do here will not work unless it received preapproval from the engineering team.</Text>
            <Input type='text' value={ drop_id } onChange={ ( { target } ) => set_drop_id( target.value ) } label='Drop ID' info='The event ID of your drop, this can be found in the confirmation email' />
            <Input type='text' value={ welcome_text } onChange={ ( { target } ) => set_welcome_text( target.value ) } label='Welcome text' info='The welcome text above the email field' />
            <Input type='text' value={ optin_text } onChange={ ( { target } ) => set_optin_text( target.value ) } label='Opt-in text (html)' info='The opt in text displayed at POAP claim.' />
            <Button onClick={ create_drop }>Create static drop</Button>

        </Main>

    </Container>
}