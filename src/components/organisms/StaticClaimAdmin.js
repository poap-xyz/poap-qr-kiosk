import { useState } from "react"
import { useTranslation } from 'react-i18next'

// Modules
import { export_emails_of_static_drop, delete_emails_of_static_drop } from '../../modules/firebase'
import { log } from "../../modules/helpers"

// Components
import Button from "../atoms/Button"
import Container from "../atoms/Container"
import Input from "../atoms/Input"
import Main from "../atoms/Main"
import Loading from "../molecules/Loading"
import { H1 } from "../atoms/Text"



export default function StaticClaimAdmin() {

    // useTranslation loads the first namespace (example 1) by default and pre caches the second variable, the t hook still needs a reference like example 2.
    // Example 1: Translations for this organism are loaded by i18next like: t( 'key.reference' )
    // Example 2: Translations for sitewide texts are in Namespace 'dispenser' and are loaded like: t( 'key.reference', { ns: 'dispenser' } )
    const { t } = useTranslation( [ 'static' , 'dispenser' ] )

    const [ drop_id, set_drop_id ] = useState( '' )
    const [ secret_code, set_secret_code ] = useState( '' )
    const [ auth_code, set_auth_code ] = useState( '' )
    const [ loading, set_loading ] = useState( false )
    const [ csv_emails, set_csv_emails ] = useState(  )

    async function export_drop() {

        try {

            set_loading( `${ t( 'admin.set_loading' ) }` )
            const { data } = await export_emails_of_static_drop( { drop_id, secret_code, auth_code } )
            log( `Remote response: `, data )
            const { csv_string, error } = data
            if ( error ) throw new Error( error || `Malformed response` )
            set_csv_emails( csv_string )

        } catch ( e ) {
            log( `CSV error: `, e )
            alert( e.message )
        } finally {
            set_loading( false )
        }

    }

    async function delete_drop_emails() {

        try {

            const very_sure = confirm( `This action deletes all collected emails and CANNOT BE UNDONE.\n\nThis is a compliance action that purges user data related to this drop from POAPs systems.` )
            if ( !very_sure ) return alert( `Action aborted. Nothing was deleted.` )

            set_loading( `${ t( 'admin.set_loading' ) }` )
            const { data } = await delete_emails_of_static_drop( { drop_id, secret_code, auth_code } )
            log( `Remote response: `, data )
            const { error } = data
            if ( error ) throw new Error( error || `Malformed response` )
            alert( `All user data was successfully deleted` )

        } catch ( e ) {
            log( `CSV error: `, e )
            alert( e.message )
        } finally {
            set_loading( false )
        }

    }

    if ( loading ) return <Loading message={ loading } />

    if ( csv_emails ) return <Container>

        <Main width='600px'>

            <H1>{ t( 'admin.auth_succes' ) }</H1>
            <Button download={ `poap_drop_${ drop_id }_email_claims-${ new Date().toDateString() }.csv` } href={ `data:text/csv;charset=utf-8,${ csv_emails }` }>{ t( 'admin.buttons.download_csv' ) }</Button>

        </Main>

    </Container>

    return <Container>

        <Main align='flex-start' width='600px'>

            <H1>{ t( 'admin.title' ) }</H1>
            <Input type='text' value={ drop_id } onChange={ ( { target } ) => set_drop_id( target.value ) } label={ t( 'admin.labels.drop_id.label' ) } info={ t( 'admin.labels.drop_id.info' ) } />
            <Input type='text' value={ secret_code } onChange={ ( { target } ) => set_secret_code( target.value ) } label={ t( 'admin.labels.secret_code.label' ) } info={ t( 'admin.labels.secret_code.info' ) } />
            <Input type='text' value={ auth_code } onChange={ ( { target } ) => set_auth_code( target.value ) } label={ t( 'admin.labels.auth_code.label' ) } info={ t( 'admin.labels.auth_code.info' ) } />
            <Button onClick={ export_drop }>{ t( 'admin.buttons.export_drop' ) }</Button>
            <Button onClick={ delete_drop_emails }>{ t( 'admin.buttons.delete_drop_emails' ) }</Button>

        </Main>

    </Container>
}