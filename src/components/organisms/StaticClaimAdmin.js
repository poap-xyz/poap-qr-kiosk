import { useState } from "react"
import Button from "../atoms/Button"
import Container from "../atoms/Container"
import Input from "../atoms/Input"
import Main from "../atoms/Main"
import Loading from "../molecules/Loading"
import { H1 } from "../atoms/Text"
import { export_emails_of_static_drop } from '../../modules/firebase'
import { log } from "../../modules/helpers"

export default function StaticClaimAdmin() {

    const [ drop_id, set_drop_id ] = useState( '' )
    const [ secret_code, set_secret_code] = useState( '' )
    const [ auth_code, set_auth_code] = useState( '' )
    const [ loading, set_loading] = useState( false )
    const [ csv_emails, set_csv_emails] = useState(  )

    async function export_drop() {

        try {

            set_loading( 'Verifying credentials' )
            const { data } = await export_emails_of_static_drop( { drop_id, secret_code, auth_code } )
            log( `Remote response: `, data )
            const { csv_string, error } = data
            if( error ) throw new Error( error || `Malformed response` )
            set_csv_emails( csv_string )

        } catch( e ) {
            log( `CSV error: `, e )
            alert( e.message )
        } finally {
            set_loading( false )
        }

    }

    if( loading ) return <Loading message={ loading } />

    if( csv_emails ) return <Container>

    <Main width='600px'>

        <H1>Authentication success</H1>
        <Button download={ `poap_drop_${ drop_id }_email_claims-${ new Date().toDateString() }.csv` } href={ `data:text/csv;charset=utf-8,${csv_emails}` }>Download emails CSV file</Button>

    </Main>

</Container>

    return <Container>

        <Main align='flex-start' width='600px'>

            <H1>Static QR Drop Export</H1>
            <Input type='text' value={ drop_id } onChange={ ( { target } ) => set_drop_id( target.value ) } label='Drop ID' info='The event ID of your drop, this can be found in the confirmation email' />
            <Input type='text' value={ secret_code } onChange={ ( { target } ) => set_secret_code( target.value ) } label='Drop Secret Edit Code' info='The secret edit code of your drop, this can be found in the confirmation email' />
            <Input type='text' value={ auth_code } onChange={ ( { target } ) => set_auth_code( target.value ) } label='Static QR authentication code' info='The secret edit code of your drop, this can be found in the confirmation email' />
            <Button onClick={ export_drop }>Authenticate and Export CSV</Button>

        </Main>

    </Container>
}