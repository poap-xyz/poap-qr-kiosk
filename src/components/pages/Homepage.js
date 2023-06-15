import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Functionality
import { useNavigate } from 'react-router-dom'
import { health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'

// Components
import { H1, H2, Text, Sup, Button, Container, LayeredText, DynamicTag } from '@poap/poap-components'
import LanguageSwitcher from '../atoms/LanguageSwitcher'
import Main from '../atoms/Main'
import { HeroImage, GirlQRImage, FooterImage } from '../molecules/Hero'
import Section from '../atoms/Section'

import { Grid, Row, Col } from '../atoms/Grid'
import Column from '../atoms/Column'
import Image from '../atoms/Image'
import Layout from '../molecules/Layout'

// Assets
import checkin from '../../assets/undraw_designer_life_re_6ywf_modified.svg'
import stream from '../../assets/undraw_conference_call_b0w6_modified.svg'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

    const navigate = useNavigate()
    const [ allowAccess, setAllowAccess ] = useState( true )

    // useTranslation loads the dispenser namespace which holds general translations
    const { t } = useTranslation( )

    /* ///////////////////////////////
	// Lifecycle management
	// /////////////////////////////*/

    // Health check
    useEffect( (  ) => {

        let cancelled = false;

        ( async () => {

            try {

                const { data: health } = await health_check()
                log( `Systems health: `, health )
                if( cancelled ) return log( `${ t( 'messaging.health.maintenance' ) }` )
                if( !dev && !health.healthy ) {
                    setAllowAccess( false )
                    // Sitewide translation
                    return alert( `${ t( 'messaging.health.maintenance' ) }` )
                }

            } catch ( e ) {
                log( `${ t( 'messaging.health.error' ) }`, e )
            }

        } )( )

        return () => cancelled = true

    }, [] )

    // ///////////////////////////////
    // Render component
    // ///////////////////////////////
    return <Layout>

        <Section>
            <HeroImage /> 

            <Container>
                <br/><br/>
                <DynamicTag tag='h2'>
                    <LayeredText color='white' label={ t( 'title' ) }/>
                </DynamicTag>
                <br/>
                <br/><br/><br/><br/><br/><br/>
                <Row>
                    <Col size={ 1 }><GirlQRImage /></Col>
                    <Col size={ 2 } justify='center' align='flex-start'>
                        <H2>{ t( 'subtitle' ) }</H2>
                        <Text>{ t( 'titledescription' ) }</Text>
                        { allowAccess && <Button onClick={ f => navigate( '/create' ) }>{ t( 'createButton' ) }</Button> }</Col>
                </Row>
            </Container>
        </Section>

        <Section>

            <Container>
                <Row justify='center' align='center' >
                    <DynamicTag tag='h2'>
                        <LayeredText label='WHAT IS '/>{ ' ' }
                        <LayeredText color='purple' label='POAP KIOSK'/>
                        <LayeredText label='?'/>
                    </DynamicTag>
                </Row>

                <Row>
                    
                    <Col>
                        <H2>{ t( 'welcome.checkin.title' ) }</H2>
                        <Text>{ t( 'welcome.checkin.description' ) }</Text>
                    </Col>
                    <Col>
                        <H2>{ t( 'welcome.stream.title' ) }</H2>
                        <Text>{ t( 'welcome.stream.description' ) }</Text>
                    </Col>
                </Row>
            </Container>
        </Section>


        <Section height='600px' justify='space-around' direction="row">

            <Column>
                <Image src={ checkin } />
            </Column>

            <Column>
                <H2>{ t( 'welcome.checkin.title' ) }</H2>
                <Text>{ t( 'welcome.checkin.description' ) }</Text>
            </Column>				

        </Section>

        <Section height='600px' justify='space-around' direction="row">

            <Column>
                <H2>{ t( 'welcome.stream.title' ) }</H2>
                <Text>{ t( 'welcome.stream.description' ) }</Text>
            </Column>		

            <Column>
                <Image src={ stream } />
            </Column>		

        </Section>

        <Section height='250px'>
            <Container>
                <Row>
                    <Col justify='center' align='center'>
                        <H2>{ t( 'startedtext' ) }</H2>
                        { allowAccess && <Button onClick={ f => navigate( '/create' ) }>{ t( 'createButton' ) }</Button> }
                    </Col>


                </Row>


            </Container>

            <FooterImage />
        </Section>


    </Layout>
    
    

}