import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Functionality
import { health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'

// Components
import Section from '../atoms/Section'
import { Row, Col } from '../atoms/Grid'
import { NumberedUps } from '../atoms/NumberedUps'
import Layout from '../molecules/Layout'
import { HeroImage, GirlQRImage, FooterImage, FullLine, StyledDutchBackgroundFullWidth, GroupPhoneImage, FooterDecorationLeft, FooterDecorationRight } from '../molecules/HomeDecorations'

import { H2, H3, Text, Button, Container, LayeredText, DynamicTag, Divider, useViewport } from '@poap/poap-components'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function Homepage( ) {

    // Navigation hooks
    const navigate = useNavigate()
    const [ allowAccess, setAllowAccess ] = useState( true )

    // i18next hook
    const { t } = useTranslation()

    // Responsive helpers
    const { isMobile, isTablet } = useViewport()

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
    return <Layout hide_background>

        <Section after='1'>
            <HeroImage /> 

            <Container>
                <Row margin={ isMobile ? 'var(--spacing-2) 0 0 0' : 'var(--spacing-8) 0 0 0' }>
                    <DynamicTag tag='h2' upper>
                        <LayeredText color='white' label={ t( 'title' ) }/>
                    </DynamicTag>
                </Row>
                <Row>
                    <Col size={ 1 }><GirlQRImage /></Col>
                    <Col size={ 2 } justify='center' align={ isMobile ? 'center' : 'flex-start' }>
                        <H2 size='var(--fs-2xl)' color='var(--primary-600)'>{ t( 'homepage.hero.subheading' ) }</H2>
                        <Text>{ t( 'homepage.hero.description' ) }</Text>
                        { allowAccess && <Button onClick={ f => navigate( '/create' ) }>{ t( 'homepage.createBtn' ) }</Button> }</Col>
                </Row>
            </Container>
            { isTablet ? null : <FullLine /> }
        </Section>

        <Section before={ 1 } height={ isMobile ? null : '700px' }>
            <Container>
                <Row justify='center' align='center' margin='var(--spacing-4) 0 var(--spacing-6) 0'>
                    <DynamicTag tag='h2' align='center' upper>
                        <LayeredText label={ t( 'homepage.whatis.layeredTitle.part1' ) }/>{ ' ' }
                        <LayeredText color='purple' label={ t( 'homepage.whatis.layeredTitle.part2' ) }/>
                        <LayeredText label='?'/>
                    </DynamicTag>
                </Row>

                <Row justify='center' align={ isMobile ? 'center' : 'flex-start' } gap='56px'>
                    <Col align='center' width='360px' padding='var(--spacing-4)'>
                        <H3 align='center'>{ t( 'homepage.whatis.checkin.title' ) }</H3>
                        <Divider margin='0 0 var(--spacing-4) 0'/>
                        <Text align='center'>{ t( 'homepage.whatis.checkin.description' ) }</Text>
                    </Col>
                    <Col align='center' width='360px' padding='var(--spacing-4)'>
                        <H3 align='center'>{ t( 'homepage.whatis.stream.title' ) }</H3>
                        <Divider margin='0 0 var(--spacing-4) 0'/>
                        <Text align='center'>{ t( 'homepage.whatis.stream.description' ) }</Text>
                    </Col>
                </Row>
            </Container>
            { isMobile ? null : <StyledDutchBackgroundFullWidth/> }
        </Section>


        <Section before={ 3 } height='700px' justify='space-around' direction='row'>
            <Container>

                <Row justify='center' align='' margin='1rem 0'>
                    <H2 size={ isTablet ? '32px' : '48px' } align='center'>{ t( 'homepage.howdo.title' ) }</H2>
                </Row>

                <Row gap='25px'>
                    <Col>
                        <NumberedUps number='1' title={ t( 'homepage.howdo.one.title' ) } description={ t( 'homepage.howdo.one.description' ) }/>
                    </Col>
                    <Col>
                        <NumberedUps number='2' title={ t( 'homepage.howdo.two.title' ) } description={ t( 'homepage.howdo.two.description' ) }/>
                    </Col>
                    <Col>
                        <NumberedUps number='3' title={ t( 'homepage.howdo.three.title' ) } description={ t( 'homepage.howdo.three.description' ) }/>
                    </Col>
                </Row>

                <GroupPhoneImage/>
            </Container>
        </Section>

        <Section height={ isTablet ? null : '300px' }>
            <Container>
                { isTablet ? null : <FooterDecorationLeft /> }
                <Row>
                    <Col justify='center' align='center'>
                        <H2 color='var(--primary-600)'>{ t( 'homepage.howdo.getStarted' ) }</H2>
                        { allowAccess && <Button onClick={ f => navigate( '/create' ) }>{ t( 'homepage.createBtn' ) }</Button> }
                    </Col>
                </Row>
                { isTablet ? null : <FooterDecorationRight /> } 
                
            </Container>

            <FooterImage />
        </Section>

    </Layout>

}