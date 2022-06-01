import Button from '../atoms/Button'
import Container from '../atoms/Container'
import Input from '../atoms/Input'
import Main from '../atoms/Main'
import Section from '../atoms/Section'
import Loading from '../molecules/Loading'
import { Text, H1, H2 } from '../atoms/Text'
import Hero from '../molecules/Hero'

// Functionality
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deleteEvent, trackEvent, health_check, listenToEventMeta } from '../../modules/firebase'
import { log, dev, wait } from '../../modules/helpers'
const { REACT_APP_publicUrl } = process.env


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function EventAdmin( ) {

	const { eventId, authToken } = useParams( )
	const [ event, setEvent ] = useState( { loading: true } )
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
	const [ loading, setLoading ] = useState( `Loading QR dispenser` )

	/* ///////////////////////////////
	// Lifecycle management
	// /////////////////////////////*/

	// Listen to event details on event ID change
	useEffect( () => {

		let cancelled = false

		log( `New event ID ${ eventId } detected, listening to event meta` )
		if( eventId ) return listenToEventMeta( eventId, event => {
			setEvent( event )
			log( `Event data detected: `, event )
			setLoading( false )
			if( !event ) {

				// Wait for 5 seconds in case the backend is refreshng public event mets
				wait( 5000 )
				if( !cancelled ) setLoading( `Double-checking admin link validity` )

				// If after 10 seconds it is still down, trigger failure
				wait( 5000 )
				if( !cancelled ) setLoading( `Invalid event admin link` )

			}
		} )

		return () => cancelled = true

	}, [ eventId ] )

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

		<Main align="flex-start" justify="space-between" direction="row">

			<Hero>

				<H1>Magic POAP Dispenser</H1>
				{ ( !event.loading && !event.codes ) ? <H2>⚠️ Your event is being reviewed</H2>: <H2>Your unique QR dispenser link</H2> }

				{ /* Event meta loaded, codes available */ }
				{ !event.loading && event.codes && <>
					<Section margin="0">
						<Text>This link is intended to be displayed on a physical device, or through a screenshare during a stream. <b>NEVER</b> send it to anyone.</Text>
						<Input
							id='admin-eventlink-public' 
							readOnly
							onClick={ focus }
							label="Your public QR Dispenser link"
							value={ eventLink }
							info="This link takes you to your QR Dispenser page. For example, you can display this page on an iPad at your check-in desk."
						/>
					</Section>
					<Section padding="0" margin="0" justify="flex-start" direction="row">
						<Button margin=".5em .5rem .5rem 0" onClick={ f => window.open( eventLink, '_self' ) }>Open link & start distributing POAPs</Button>
						{ clipboardAPI && <Button onClick={ f => clipboard( eventLink ) }>Copy to clipboard</Button> }
					</Section>
				</> }

				{ /* Event meta loaded, no codes available */ }

				{ !event.loading && !event.codes && <Section align='flex-start' margin="0">

					<Text>This QR dispenser will become available once the curation team approves your event.</Text>
					<Text>You will receive an email when your event is approved. This email will also send you the manual claim links in a links.txt file. You don&apos;t have to use them, but it is ok to use them in combination with this QR dispenser.</Text>
				</Section> }

			</Hero>

			<Section margin="0" align="flex-start">
				<H1>Secret Admin Section</H1>

				<Section align="flex-start">
					<H2>Delete this QR dispenser</H2>
					<Text>Want to create a new QR dispenser for this drop? Delete this QR dispenser first, and then create a new dispenser when you are ready.</Text>
					<Button onClick={ safelyDeleteEvent }>Delete QR dispenser</Button>
				</Section>


				<Section align="flex-start">
					<H2>Admin link</H2>
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

				

			</Section>


		</Main>
		
	</Container>

}