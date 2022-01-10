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
import { useHistory } from 'react-router-dom'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

	const history = useHistory()
	const [ allowAccess, setAllowAccess ] = useState( true )
	const [ password, setPassword ] = useState( 'erc721' )

	/* ///////////////////////////////
	// Lifecycle management
	// /////////////////////////////*/

	// Note to self/team: this is not meant to be secure, it is a low-effort beta-gate
	useEffect( f => setAllowAccess( password.toLowerCase() == 'erc721' ), [ password ] )

	// ///////////////////////////////
	// Render component
	// ///////////////////////////////
	return <Container>

		<Main justify='flex-start'>

			<Hero>

				<H1>Magic POAP Dispenser <Sup>beta</Sup></H1>
				<H2>Get POAPs to your friends IRL</H2>
				<Text>Just input your .txt file, and watch your phone turn into a POAP QR dispenser at the click of a button. You&apos;ll be able to show QR codes for everyone to scan one by one.</Text>
				{ allowAccess && <Button onClick={ f => history.push( '/create' ) }>Create QR dispenser</Button> }
				{ !allowAccess && <>
					<Input id='welcome-beta-password' type='password' placeholder='P4ssword' onChange={ ( { target } ) => setPassword( target.value ) } label='Beta password' value={ password } />
					<Button onClick={ f => alert( 'Wrong password' ) }>Submit password</Button>
				</> }

			</Hero>

			<Section height='500px' justify='space-around' direction="row">

				<Column>
					<Image src={ checkin } />
				</Column>

				<Column>
					<H2>Physical POAP distribution made easy</H2>
					<Text>Easily set up a device at your physical event that dispenses unique POAP QR codes to visitors.</Text>
				</Column>				

			</Section>

			<Section height='500px' justify='space-around' direction="row">

				<Column>
					<H2>Stream-friendly QR sharing</H2>
					<Text>Set up a screenshare that displays POAP QRs in a farming-resistant way.</Text>
				</Column>		

				<Column>
					<Image src={ stream } />
				</Column>		

			</Section>

			<Section height='500px'>

					<H2>Get started now</H2>
					{ allowAccess && <Button onClick={ f => history.push( '/create' ) }>Create QR dispenser</Button> }

			</Section>

		</Main>

	</Container>

}