import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Main from '../atoms/Main'
import Hero from '../molecules/Hero'
import Section from '../atoms/Section'
import Column from '../atoms/Column'
import Input from '../atoms/Input'
import Image from '../atoms/Image'
import { Text, H1, H2, Sup } from '../atoms/Text'
import { useEffect, useState } from 'react'

import checkin from '../../assets/undraw_designer_life_re_6ywf_modified.svg'
import stream from '../../assets/undraw_conference_call_b0w6_modified.svg'

// Functionality
import { useNavigate } from 'react-router-dom'
import { health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

	const navigate = useNavigate()
	const [ allowAccess, setAllowAccess ] = useState( true )

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

			<Hero>

				<H1>Magic POAP Dispenser <Sup>beta</Sup></H1>
				<H2>Get POAPs to your friends IRL</H2>
				<Text>Just input your .txt file of mint links and watch your phone turn into a POAP QR dispenser at the click of a button. You&apos;ll be able to display QR codes for attendees to scan one-by-one.</Text>
				{ allowAccess && <Button onClick={ f => navigate( '/create' ) }>Create QR dispenser</Button> }

			</Hero>

			<Section height='600px' justify='space-around' direction="row">

				<Column>
					<Image src={ checkin } />
				</Column>

				<Column>
					<H2>Physical POAP distribution made easy</H2>
					<Text>For IRL events, easily set up a device, or multiple devices, to display unique POAP QR codes to attendees.</Text>
				</Column>				

			</Section>

			<Section height='600px' justify='space-around' direction="row">

				<Column>
					<H2>Stream-friendly QR sharing</H2>
					<Text>During a livestream, set up a screenshare that displays POAP QR codes in a farming-resistant manner.</Text>
				</Column>		

				<Column>
					<Image src={ stream } />
				</Column>		

			</Section>

			<Section height='500px'>

					<H2>Get started now</H2>
					{ allowAccess && <Button onClick={ f => navigate( '/create' ) }>Create QR dispenser</Button> }

			</Section>

		</Main>

	</Container>

}