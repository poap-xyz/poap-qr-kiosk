import styled from 'styled-components'

// Image that behaves like a background image
import logo from '../../assets/logo.svg'
const BackgroundImage = styled.img.attrs( props => ( {
	src: logo
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
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	width: 100%;
	padding:  0 2rem;
	box-sizing: border-box;
	& * {
		box-sizing: border-box;
	}
`

// Container that always has the background image
export default ( { children, ...props } ) => <Wrapper { ...props }>
	<BackgroundImage key='background' />
	{ children }
</Wrapper>