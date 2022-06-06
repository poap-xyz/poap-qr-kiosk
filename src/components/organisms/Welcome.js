import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Main from '../atoms/Main'
import Hero from '../molecules/Hero'
import Section from '../atoms/Section'
import Column from '../atoms/Column'
import Image from '../atoms/Image'
import { Text, H1, H2, Sup } from '../atoms/Text'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import checkin from '../../assets/undraw_designer_life_re_6ywf_modified.svg'
import stream from '../../assets/undraw_conference_call_b0w6_modified.svg'

// Functionality
import { useNavigate } from 'react-router-dom'
import { health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'

// Components
import LanguageSwitcher from '../atoms/LanguageSwitcher'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

	const navigate = useNavigate()
	const [ allowAccess, setAllowAccess ] = useState( true )

	const { t } = useTranslation( [ 'dispenser' ] )

	/* ///////////////////////////////
	// Lifecycle management
	// /////////////////////////////*/

	// Health check
	useEffect( (	) => {

		let cancelled = false;

		( async () => {

			try {

				const { data: health } = await health_check()
				log( `Systems health: `, health )
				if( cancelled ) return log( `Health effect cancelled` )
				if( !dev && !health.healthy ) {
					setAllowAccess( false )
					return alert( `The POAP system is undergoing some maintenance, the QR dispenser might not work as expected during this time.\n\nPlease check our official channels for details.` )
				}

			} catch( e ) {
				log( `Error getting system health: `, e )
			}

		} )( )

		return () => cancelled = true

	}, [] )

	// ///////////////////////////////
	// Render component
	// ///////////////////////////////
	return <Container>

		<Main justify='flex-start'>

			<LanguageSwitcher />

			<Hero>

				<H1>{t('title')} <Sup>beta</Sup></H1>
				<H2>{t('hero.subheading')}</H2>
				<Text>{t('hero.description')}</Text>
				{ allowAccess && <Button onClick={ f => navigate( '/create' ) }>{t('createButton')}</Button> }

			</Hero>

			<Section height='600px' justify='space-around' direction="row">

				<Column>
					<Image src={ checkin } />
				</Column>

				<Column>
					<H2>{t('checkin.title')}</H2>
					<Text>{t('checkin.description')}</Text>
				</Column>				

			</Section>

			<Section height='600px' justify='space-around' direction="row">

				<Column>
					<H2>{t('stream.title')}</H2>
					<Text>{t('stream.description')}</Text>
				</Column>		

				<Column>
					<Image src={ stream } />
				</Column>		

			</Section>

			<Section height='500px'>

				<H2>{t('startedtext')}</H2>
				{ allowAccess && <Button onClick={ f => navigate( '/create' ) }>{t('createButton')}</Button> }

			</Section>

		</Main>

	</Container>

}