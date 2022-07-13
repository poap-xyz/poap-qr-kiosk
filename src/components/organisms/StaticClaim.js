import { useState, useEffect } from 'react'
import { log, dev, wait } from '../../modules/helpers'
import { useParams } from 'react-router-dom'

import Loading from '../molecules/Loading'
import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Input from '../atoms/Input'
import Main from '../atoms/Main'
import { H1, H2, Text } from '../atoms/Text'
import Section from '../atoms/Section'
import { useCodeMetadata } from '../../hooks/printed_qrs'

import { claim_code_by_email } from '../../modules/firebase'

export default function StaticClaim() {

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
            if( code_meta?.drop_meta?.optin_text && !termsAccepted ) throw new Error( `Please accept the terms in order to continue` )
            if( !email?.includes( '@' ) ) throw new Error( `Please input a valid email address` )
            if( !claim_code ) throw new Error( `Your QR is invalid, please scan it again` )

            // Register claim with firebase
            setLoading( `Claiming your POAP` )
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
    if( code_meta?.event === 'loading' ) return <Loading message={ 'Verifying your QR' } />

    // If code was already used, show error message
    if( code_meta?.claimed === true ) return <Container>
        <Text>This QR was already used.</Text>
    </Container>

    // If no drop meta available, the user is trying to cheat or has a malformed link
    if( !code_meta?.event ) return <Container>
        <Text>You scanned an invalid link, please contact the event organiser.</Text>
    </Container>

    // If the user claimed the POAP, tell them to check their email
    if( user_claimed ) return <Container>

        <Main align='flex-start' width='400px'>
            <H1>You successfully claimed your POAP!</H1>
            <H2>Check your inbox at { email }</H2>
            <Text>The email contains instructions on how to view your POAP, and claim it to a crypto wallet if you want to do so.</Text>
        </Main>

    </Container>

    // Show claim interface
    return <Container>

        <Main align='flex-start' width='400px'>
            <H1>Claim your POAP</H1>
            <Input id='static-print-qr-email-field' label='Your email' value={ email } onChange={ ( { target } ) => setEmail( target.value ) } />
                            
            { code_meta?.drop_meta?.optin_text && <Text onClick={ f => setTermsAccepted( !termsAccepted ) } direction='row'>
                <Input margin='0' width='50px' type='checkbox' onChange={ ( { target } ) => setTermsAccepted( target.checked ) } checked={ termsAccepted } />
                
                { /* This allows us to set terms & conditions texts through the firebase entry */ }
                <span dangerouslySetInnerHTML={ { __html: code_meta?.drop_meta?.optin_text } } />
            </Text> }
            
            <Button id='static-print-qr-claim-button' onClick={ claim_poap } color={ ( termsAccepted || !code_meta?.drop_meta?.optin_text ) ? 'primary' : 'text' }>Claim your POAP</Button>
        </Main>

    </Container>
}