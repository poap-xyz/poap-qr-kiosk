import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'

// Image that behaves like a background image
import logo from '../../assets/logo.svg'
import { useEvent, useLocalstoredEvent } from '../../hooks/events'
import { log } from '../../modules/helpers'
import Style from './Style'
const BackgroundImage = styled.img.attrs( props => ( {
	src: props.src || logo
} ) )`
	position: absolute;
	z-index: -1;
	right: 50%;
	transform: translateY( -50% );
	/*top: 50%;*/
	transform: translateX( 50% );
	width: 90%;
	opacity: .05;
`

const Wrapper = styled.div`
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	width: 100%;
	padding:  0 max( 1rem, calc( 25vw - 8rem ) );
	box-sizing: border-box;
	& * {
		box-sizing: border-box;
	}
`

// Container that always has the background image
export default ( { children, background, ...props } ) => {

	// Get event ID from different sources
	const location = useLocation()

	// Event ID form url
	const { eventId: routeEventId } = useParams()

	// Event ID from pushed state
	const { eventId: stateEventId } = location

	// Load event details in case there is custom css
	const eventId = useLocalstoredEvent()
	const event = useEvent( eventId || stateEventId || routeEventId )

	log( `Rendering container with event: `, event )
	return <Wrapper { ...props }>
		<BackgroundImage src={ background } key='background' />
		{ children }
		<Style styles={ event?.css } />
	</Wrapper>
}