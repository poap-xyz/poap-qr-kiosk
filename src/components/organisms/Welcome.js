import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Main from '../atoms/Main'
import Section from '../atoms/Section'
import Hero from '../molecules/Hero'
import Input from '../atoms/Input'
import { Text, H1, H2 } from '../atoms/Text'
import { useEffect, useState } from 'react'

// Functionality
import { useHistory } from 'react-router-dom'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

	const history = useHistory()
	const [ allowAccess, setAllowAccess ] = useState( !!process.env.CI )
	const [ password, setPassword ] = useState( '' )

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

				<H1>POAP QR code kiosk</H1>
				<H2>Stressless POAP code distribution at physical events</H2>
				<Text>Turn your claim code .txt file into a webpage that displays them as easy-to-scan QR codes. Perfect for POAP claims at a physical event check-ins.</Text>
				{ allowAccess && <Button onClick={ f => history.push( '/create' ) }>Create QR kiosk</Button> }
				{ !allowAccess && <Input type='password' placeholder='P4ssword' onChange={ ( { target } ) => setPassword( target.value ) } label='Beta password' value={ password } /> }

			</Hero>

		</Main>
		
	</Container>

}