import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

// Image that behaves like a background image
import logo from '../../assets/logo.svg'
import { useCustomCSS } from '../../hooks/custom_css'
import { log } from '../../modules/helpers'
import Style from './Style'

const BackgroundImage = styled.img.attrs( ( { src, generic_styles } ) => ( {
	src: generic_styles ? undefined : src || logo
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
export default ( { children, background, generic_loading_styles, className, ...props } ) => {


	const css = useCustomCSS()
	const { search } = useLocation()
	const blank_until_custom_css = search.includes( 'blank_loading=true' )
	log( `Query paran lazy_css requested a blank page until custom CSS is checked: ${ blank_until_custom_css }`, css )

	// Force a blank page until the (potential) custom CSS is loaded?
	if( blank_until_custom_css && css == 'loading' ) return

	return <Wrapper className={ `${ className } global_container` } { ...props }>
		<BackgroundImage id="global_background_image" generic_styles={ generic_loading_styles } src={ background } key='background' />
		{ children }
		<Style styles={ css } />
	</Wrapper>
}