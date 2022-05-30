import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Input from '../atoms/Input'
import Main from '../atoms/Main'
import Section from '../atoms/Section'
import Loading from '../molecules/Loading'
import { Text, H1 } from '../atoms/Text'

// Functionality
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deleteEvent, trackEvent, health_check } from '../../modules/firebase'
import { log, dev } from '../../modules/helpers'
const { REACT_APP_publicUrl } = process.env


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function EventAdmin( ) {

	const { eventId, authToken } = useParams( )
	const navigate = useNavigate()
	const eventLink = `${ dev ? 'http://localhost:3000' : REACT_APP_publicUrl }/#/event/${ eventId }`
	const adminLink = `${ dev ? 'http://localhost:3000' : REACT_APP_publicUrl }/#/event/admin/${ eventId }/${ authToken }`
	const clipboardAPI = !!navigator.clipboard

	// Health check
	useEffect( (  ) => {

		let cancelled = false;

		( async () => {

			try {

				const { data: health } = await health_check()
				log( `Systems health: `, health )
				if( cancelled ) return log( `Health effect cancelled` )
				if( !health.healthy ) return alert( `The POAP system is undergoing some maintenance, the QR dispenser might not work as expected during this time.\n\nPlease check our official channels for details.` )

			} catch( e ) {
				log( `Error getting system health: `, e )
			}

		} )( )

		return () => cancelled = true

	}, [] )

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
		trackEvent( 'admin_link_copied_clipboard' )
	}
	// Data management
	async function safelyDeleteEvent(  ) {

		try {

			if( !confirm( `Are you sure you want to delete your QR Dispenser?\n\nThis cannot be undone, but you can always create a new QR Dispenser following the same simple steps you used to make this one.` ) ) throw new Error( `Deletion cancelled, your event still exists.` )

			setLoading( 'Delete QR Dispenser' )
			const { data: { error } } = await deleteEvent( {
				eventId,
				authToken
			} )

			if( error ) throw new Error( error )

			alert( `Deletion success!\n\nYour QR Dispenser has been deleted.\n\nClick OK to be redirected to the home page. ` )
			trackEvent( 'admin_event_deleted' )
			return navigate( '/' )

		} catch( e ) {
			alert( `Error Delete QR Dispenser: ${ e.message }` )
			log( e )
			setLoading( false )
		}

	}

	// ///////////////////////////////
	// Render component
	// ///////////////////////////////
	if( loading ) return <Loading message={ loading } />
	return <Container>

		<Main align="flex-start" width='600px'>

			<H1>QR Dispenser links</H1>
			
			<Section align="flex-start">
				<Text>Open your public QR Dispenser link in a new tab on the browser of your device to distribute POAPs to all your closest frens.</Text>
				<Input
					id='admin-eventlink-public' 
					readOnly
					onClick={ focus }
					label="Your public QR Dispenser link"
					value={ eventLink }
					info="This link takes you to your QR Dispenser page. For example, you can display this page on an iPad at your check-in desk."
				/>
				{ clipboardAPI && <Button onClick={ f => clipboard( eventLink ) }>Copy QR Dispenser link to clipboard</Button> }
			</Section>

			<Section>
				<Text>Your admin link is yours to make changes to this instance of the magic POAP dispenser. Don&apos;t share this with anyone!</Text>
				<Input
					id='admin-eventlink-secret'
					readOnly
					onClick={ focus }
					label="Your secret admin link"
					value={ adminLink }
					info="The link to this admin page, the page you are seeing now. This link allows you to delete your QR Dispenser. Keep it secret!"
				/>
				{ clipboardAPI && <Button onClick={ f => clipboard( adminLink ) }>Copy secret admin link to clipboard</Button> }
			</Section>

			<H1>Admin actions</H1>
			<Section>
				<Text>Want to create a new QR dispenser for this drop? Delete this QR dispenser first, and then create a new dispenser when you are ready.</Text>
				<Button onClick={ safelyDeleteEvent }>Delete QR dispenser</Button>
			</Section>

		</Main>
		
	</Container>

}