import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Main from '../atoms/Main'
import Section from '../atoms/Section'
import { Text, H1 } from '../atoms/Text'

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

		<Main>

			<H1>POAP QR Kiosk</H1>
			
			<Section>
				<Text align='center'>The QR kiosk app allows you to create a webpage you can use to distribute POAP claim codes at your physical event.</Text>
				<Text align='center'>Once you create your QR kiosk, you can for example have an tablet at your event that attendees can scan. Every time a QR is scanned, the system automatically shows a new one for the next attendee.</Text>
				<Text align='center'>This app is only useful if you already have claim codes.</Text>
				<Button onClick={ f => history.push( '/create' ) }>Create QR kiosk</Button>
			</Section>

		</Main>
		
	</Container>

}