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

import { useTranslation } from 'react-i18next'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function EventAdmin( ) {

	const { t } = useTranslation( [ 'eventAdmin' , 'dispenser' ] )

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
				return alert( `${ t( 'health.maintenance', { ns: 'dispenser' } ) }` )

			} catch( e ) {
				log( `Error getting system health: `, e )
			}

		} )( )

		return () => cancelled = true

	}, [] )

	// ///////////////////////////////
	// State management
	// ///////////////////////////////
	const [ loading, setLoading ] = useState( `${ t( 'loadingDispenser' ) }` )

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
				if( !cancelled ) setLoading( `${ t( 'loadingValidity' ) }` )

				// If after 10 seconds it is still down, trigger failure
				wait( 5000 )
				if( !cancelled ) setLoading( `${ t( 'invalidValidity' ) }` )

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

			if( !confirm( `${ t( 'confirmDeleteDispenser' ) }` ) ) throw new Error( `${ t( 'deletionCancelled' ) }` )

			setLoading( `${ t( 'setLoadingDispenser' ) }` )
			const { data: { error } } = await deleteEvent( {
				eventId,
				authToken
			} )

			if( error ) throw new Error( error )

			alert( `${ t( 'succesDeleteDispenser' ) }` )
			trackEvent( 'admin_event_deleted' )
			return navigate( '/' )

		} catch( e ) {
			alert( `${ t( 'errorDeleteDispenser', { message: e.message } ) }` )
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

				<H1>{ t( 'title' ) }</H1>
				{ ( !event.loading && !event.codes ) ? <H2>{ t( 'hero.subheading.reviewed' ) }</H2>: <H2>{ t( 'hero.subheading.unique' ) }</H2> }

				{ /* Event meta loaded, codes available */ }
				{ !event.loading && event.codes && <>
					<Section margin="0">
						<Text>
						{ t( 'hero.description.pre' ) }<b>{ t( 'hero.description.bold' ) }</b>{ t( 'hero.description.post' ) }
						</Text>
						<Input
							id='admin-eventlink-public' 
							readOnly
							onClick={ focus }
							label={ t( 'hero.input.label' ) }
							value={ eventLink }
							info={ t( 'hero.input.info' ) }
						/>
					</Section>
					<Section padding="0" margin="0" justify="flex-start" direction="row">
						<Button margin=".5em .5rem .5rem 0" onClick={ f => window.open( eventLink, '_self' ) }>{ t( 'hero.distribute.button' ) }</Button>
						{ clipboardAPI && <Button onClick={ f => clipboard( eventLink ) }>{ t( 'hero.distribute.clipboard' ) }</Button> }
					</Section>
				</> }

				{ /* Event meta loaded, no codes available */ }

				{ !event.loading && !event.codes && <Section align='flex-start' margin="0">

					<Text>{ t( 'hero.notavailable.title' ) }</Text>
					<Text>{ t( 'hero.notavailable.description' ) }</Text>
				</Section> }

			</Hero>

			<Section margin="0" align="flex-start">
				<H1>{ t( 'deleteDispenser.title' ) }</H1>

				<Section align="flex-start">
					<H2>{ t( 'deleteDispenser.subheading' ) }</H2>
					<Text>{ t( 'deleteDispenser.description' ) }</Text>
					<Button onClick={ safelyDeleteEvent }>{ t( 'deleteDispenser.deleteBtn' ) }</Button>
				</Section>


				<Section align="flex-start">
					<H2>{ t( 'adminDispenser.title' ) }</H2>
					<Text>{ t( 'adminDispenser.description' ) }</Text>
					<Input
						id='admin-eventlink-secret'
						readOnly
						onClick={ focus }
						label={ t( 'adminDispenser.input.label' ) }
						value={ adminLink }
						info={ t( 'adminDispenser.input.info' ) }
					/>
					{ clipboardAPI && <Button onClick={ f => clipboard( adminLink ) }>{ t( 'adminDispenser.clipboard' ) }</Button> }
				</Section>

				

			</Section>


		</Main>
		
	</Container>

}