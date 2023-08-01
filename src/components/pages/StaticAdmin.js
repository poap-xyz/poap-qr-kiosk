import { useState } from "react"
import { useTranslation } from 'react-i18next'

// Modules
import { export_emails_of_static_drop, delete_emails_of_static_drop } from '../../modules/firebase'
import { log } from "../../modules/helpers"

// Components
import Loading from "../molecules/Loading"
import Layout from "../molecules/Layout"
import Section from "../atoms/Section"
import { Row, Col } from "../atoms/Grid"
import { CardContainer, Container, Button, Input, H1 } from "@poap/poap-components"



export default function StaticClaimAdmin() {

    // i18next hook
    const { t } = useTranslation()

    const [ drop_id, set_drop_id ] = useState( '' )
    const [ secret_code, set_secret_code ] = useState( '' )
    const [ auth_code, set_auth_code ] = useState( '' )
    const [ loading, set_loading ] = useState( false )
    const [ csv_emails, set_csv_emails ] = useState(  )

    async function export_drop() {

        try {

            set_loading( `${ t( 'staticAdmin.set_loading' ) }` )
            const { data } = await export_emails_of_static_drop( { drop_id, secret_code, auth_code } )
            log( `Remote response: `, data )
            const { csv_string, error } = data
            if( error ) throw new Error( error || `Malformed response` )
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
            if( !very_sure ) return alert( `Action aborted. Nothing was deleted.` )

            set_loading( `${ t( 'staticAdmin.set_loading' ) }` )
            const { data } = await delete_emails_of_static_drop( { drop_id, secret_code, auth_code } )
            log( `Remote response: `, data )
            const { error } = data
            if( error ) throw new Error( error || `Malformed response` )
            alert( `All user data was successfully deleted` )

        } catch ( e ) {
            log( `CSV error: `, e )
            alert( e.message )
        } finally {
            set_loading( false )
        }

    }

    if( loading ) return <Loading message={ loading } />

    if( csv_emails ) return <Layout center hide_footer>
        <Section>
            <Container>
                <CardContainer width='900px'>
                    <H1>{ t( 'staticAdmin.auth_succes' ) }</H1>
                    <Button download={ `poap_drop_${ drop_id }_email_claims-${ new Date().toDateString() }.csv` } href={ `data:text/csv;charset=utf-8,${ csv_emails }` }>{ t( 'staticAdmin.buttons.download_csv' ) }</Button>

                </CardContainer>
            </Container>
        </Section>
    </Layout>

    return <Layout center hide_footer>
        <Section>
            <Container>
                <CardContainer width='900px'>
                    <H1>{ t( 'staticAdmin.title' ) }</H1>
                    <Input type='text' value={ drop_id } onChange={ ( { target } ) => set_drop_id( target.value ) } label={ t( 'staticAdmin.labels.drop_id.label' ) } info={ t( 'staticAdmin.labels.drop_id.info' ) } />
                    <Input type='text' value={ secret_code } onChange={ ( { target } ) => set_secret_code( target.value ) } label={ t( 'staticAdmin.labels.secret_code.label' ) } info={ t( 'staticAdmin.labels.secret_code.info' ) } />
                    <Input type='text' value={ auth_code } onChange={ ( { target } ) => set_auth_code( target.value ) } label={ t( 'staticAdmin.labels.auth_code.label' ) } info={ t( 'staticAdmin.labels.auth_code.info' ) } />
                    <Row>
                        <Col><Button onClick={ export_drop }>{ t( 'staticAdmin.buttons.export_drop' ) }</Button></Col>
                        <Col><Button onClick={ delete_drop_emails } margin='0 0 0 var(--spacing-2)'>{ t( 'staticAdmin.buttons.delete_drop_emails' ) }</Button></Col>
                    </Row>
                    


                </CardContainer>
            </Container>
        </Section>

    </Layout>
}