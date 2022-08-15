import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Modules
import { log, dev, wait } from '../../modules/helpers'
import { claim_code_by_email } from '../../modules/firebase'

// Hooks
import { useCodeMetadata } from '../../hooks/printed_qrs'

// Components
import Loading from '../molecules/Loading'
import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Input from '../atoms/Input'
import Main from '../atoms/Main'
import { H1, H2, Text } from '../atoms/Text'


export default function StaticClaim() {

    // useTranslation loads the first namespace (example 1) by default and pre caches the second variable, the t hook still needs a reference like example 2.
	// Example 1: Translations for this organism are loaded by i18next like: t( 'key.reference' )
	// Example 2: Translations for sitewide texts are in Namespace 'dispenser' and are loaded like: t( 'key.reference', { ns: 'dispenser' } )
	const { t } = useTranslation( [ 'static' , 'dispenser' ] )

    const [ email, setEmail ] = useState( '' )
    const [ termsAccepted, setTermsAccepted ] = useState( false )
    const [ user_claimed, set_user_claimed ] = useState( false )
    const { claim_code } = useParams()
    const code_meta = useCodeMetadata( claim_code )
    const [ loading, setLoading ] = useState(  )

    async function claim_poap() {

        log( `Starting claim for claimcode ${ claim_code } for ${ email }` )
        try {

            // Validate inputs
            if( code_meta?.drop_meta?.optin_text && !termsAccepted ) throw new Error( `${ t( 'claim.validations.accept_terms') }` )
            if( !email?.includes( '@' ) ) throw new Error( `${ t( 'claim.validations.valid_email') }` )
            if( !claim_code ) throw new Error( `${ t( 'claim.validations.invalid_qr') }` )

            // Register claim with firebase
            setLoading( `${ t( 'claim.set_loading' ) }` )
            const { data: response } = await claim_code_by_email( { claim_code, email } )
            const { error, success } = response
            log( `Remote response `, response )

            if( error ) throw new Error( `${ error } (remote)` )
            set_user_claimed( true )

        } catch( e ) {

            log( `POAP claim error:`, e )
            alert( `Claim error: ${ e.message }` )

        } finally {
            setLoading( false )
        }

    }

    /* ///////////////////////////////
    // Component rendering
    // /////////////////////////////*/

    // If loading, show spinner
    if( loading ) return <Loading message={ loading } />

    // If no code meta is available yet, show spinner
    if( code_meta?.event === 'loading' ) return <Loading message={ t( 'claim.validations.verifying_qr' ) } />

    // If code was already used, show error message
    if( code_meta?.claimed === true ) return <Container>
        <Text>{ t( 'claim.validations.used_qr' ) }</Text>
    </Container>

    // If no drop meta available, the user is trying to cheat or has a malformed link
    if( !code_meta?.event ) return <Container>
        <Text>{ t( 'claim.validations.invalid_link' ) }</Text>
    </Container>

    // If the user claimed the POAP, tell them to check their email
    if( user_claimed ) return <Container>

        <Main align='flex-start' width='400px'>
            <H1>{ t( 'claim.user_claimed.title') }</H1>
            <H2>{ t( 'claim.user_claimed.subtitle' , { email: email } ) }</H2>
            <Text>{ t( 'claim.user_claimed.description') }</Text>
        </Main>

    </Container>

    // Show claim interface
    return <Container>

        <Main align='flex-start' width='400px'>
            <H1 id='static-print-qr-h1'>{ t( 'claim.title' ) }</H1>

            { code_meta?.drop_meta?.welcome_text && <Text id='static-print-qr-welcome-text'>{ code_meta?.drop_meta?.welcome_text }</Text> }

            <Input id='static-print-qr-email-field' label={ t( 'claim.labels.email.label' ) } value={ email } onChange={ ( { target } ) => setEmail( target.value ) } />
                            
            { code_meta?.drop_meta?.optin_text && <Text align='flex-start' onClick={ f => setTermsAccepted( !termsAccepted ) } direction='row'>
                <Input style={ { zoom: 1.3 } } margin='0 .5rem 0 0' width='50px' type='checkbox' onChange={ ( { target } ) => setTermsAccepted( target.checked ) } checked={ termsAccepted } />
                
                { /* This allows us to set terms & conditions texts through the firebase entry */ }
                <span dangerouslySetInnerHTML={ { __html: code_meta?.drop_meta?.optin_text } } />
            </Text> }
            
            <Button id='static-print-qr-claim-button' onClick={ claim_poap } color={ ( termsAccepted || !code_meta?.drop_meta?.optin_text ) ? 'primary' : 'text' }>{ t( 'claim.buttons.claim_poap' ) }</Button>
        </Main>

        { /* If this drop has custom CSS associated with it, inject it raw */ }
        { code_meta?.drop_meta?.custom_css && <style dangerouslySetInnerHTML={ { __html: code_meta?.drop_meta?.custom_css } } /> }

    </Container>
}