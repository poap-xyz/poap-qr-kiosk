import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Input from '../atoms/Input'
import Main from '../atoms/Main'
import Section from '../atoms/Section'
import Loading from '../molecules/Loading'
import { Text, H1 } from '../atoms/Text'

// Functionality
import { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { deleteEvent } from '../../modules/firebase'
import { log } from '../../modules/helpers'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function EventAdmin( ) {

	const { eventId, authToken } = useParams( )
	const history = useHistory()
	const eventLink = `https://poap-qr-kiosk.web.app/#/event/${ eventId }`
	const adminLink = `https://poap-qr-kiosk.web.app/#/event/admin/${ eventId }/${ authToken }`
	const clipboardAPI = !!navigator.clipboard

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( false )

	// ///////////////////////////////
	// Component functions
	// ///////////////////////////////

	// Links management
	const focus = e => e.target.select()
	const clipboard = async text => {
		await navigator.clipboard.writeText( text )
		alert( 'Copied to clipboard!' )
	}
	// Data management
	async function safelyDeleteEvent(  ) {

		try {

			if( !confirm( `Are you sure you want to delete this event? This CANNOT be undone!` ) ) throw new Error( `Deletion cancelled, your event still exists.` )

			setLoading( 'Deleting event' )
			const { data: { error } } = await deleteEvent( {
				eventId,
				authToken
			} )

			if( error ) throw new Error( error )

			alert( `Deletion success!\n\nYour event and its codes were deleted.\n\nRedirecting you to the home page.` )
			history.push( '/' )

		} catch( e ) {
			alert( `Error deleting event: ${ e.message }` )
			log( e )
		} finally {
			setLoading( false )
		}

	}

	// ///////////////////////////////
	// Render component
	// ///////////////////////////////
	if( loading ) return <Loading message={ loading } />
	return <Container>

		<Main align="flex-start">

			<H1>Event links</H1>

			<Text>⚠️ BETA WARNING: the email system doesn't work yet, please sve the links below somewhere.</Text>
			
			<Section>
				<Input onClick={ focus } label="Your public event link" value={ eventLink } />
				{ clipboardAPI && <Button onClick={ f => clipboard( eventLink ) }>Copy event link to clipboard</Button> }
			</Section>

			<Section>
				<Input onClick={ focus } label="Your secret admin link" value={ adminLink } />
				{ clipboardAPI && <Button onClick={ f => clipboard( adminLink ) }>Copy secret admin link to clipboard</Button> }
			</Section>

			<H1>Admin actions</H1>
			<Section>
				<Text>If you want to re-upload a different list of codes, you need to delete your existing event first since codes can't be updated. This will delete your QR kiosk event but not your POAP event.</Text>
				<Button onClick={ safelyDeleteEvent }>Delete event</Button>
			</Section>

		</Main>
		
	</Container>

}