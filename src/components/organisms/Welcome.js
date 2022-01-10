import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Main from '../atoms/Main'
import Hero from '../molecules/Hero'
import Input from '../atoms/Input'
import { Text, H1, H2, Sup } from '../atoms/Text'
import { useEffect, useState } from 'react'

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
				{ allowAccess && <Button onClick={ f => history.push( '/create' ) }>Create QR kiosk</Button> }
				{ !allowAccess && <>
					<Input id='welcome-beta-password' type='password' placeholder='P4ssword' onChange={ ( { target } ) => setPassword( target.value ) } label='Beta password' value={ password } />
					<Button onClick={ f => alert( 'Wrong password' ) }>Submit password</Button>
				</> }

			</Hero>

		</Main>

	</Container>

}