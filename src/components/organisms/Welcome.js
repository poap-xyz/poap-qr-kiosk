import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Main from '../atoms/Main'
import Section from '../atoms/Section'
import Hero from '../molecules/Hero'
import { Text, H1, H2 } from '../atoms/Text'

// Functionality
import { useHistory } from 'react-router-dom'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

	const history = useHistory()

	// ///////////////////////////////
	// Render component
	// ///////////////////////////////
	return <Container>

		<Main justify='flex-start'>

			<Hero>

				<H1>POAP QR code kiosk</H1>
				<H2>Stressless POAP code distribution at physical events</H2>
				<Text>Turn your claim code .txt file into a webpage that displays them as easy-to-scan QR codes. Perfect for POAP claims at a physical event check-ins.</Text>
				<Button onClick={ f => history.push( '/create' ) }>Create QR kiosk</Button>

			</Hero>

		</Main>
		
	</Container>

}