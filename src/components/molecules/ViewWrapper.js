import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

// Image that behaves like a background image
import logo from '../../assets/illustrations/Illustration_Cities_Amsterdam.svg'
import { useCustomCSS } from '../../hooks/custom_css'
import { log } from '../../modules/helpers'
import Style from '../atoms/Style'
import Main from '../atoms/Main'
import { Container, POAPBookmark, mixin } from '@poap/poap-components'


const BackgroundImage = styled.img.attrs( ( { src, generic_styles } ) => ( {
    src: generic_styles ? undefined : src || logo
} ) )`
    position: absolute;
    bottom: 0;
    z-index: -1;
    width: 100%;
    opacity: 0.75;
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
    padding:  1rem;
    box-sizing: border-box;
    & * {
        box-sizing: border-box;
    }
`

const StyledBookmark = styled( POAPBookmark )`
    position: absolute;
    top: 0;
    right: var(--spacing-4);

    ${ mixin.sm_up`
        right: var(--spacing-6);
    ` }

    ${ mixin.md_up`
        right: var(--spacing-8);
    ` }
`

// Container that always has the background image
export default ( { children, background, hide_background, generic_loading_styles, show_bookmark, className, ...props } ) => {

    const css = useCustomCSS()
    const { search } = useLocation()
    const blank_until_custom_css = search.includes( 'blank_loading=true' )
    log( `Query paran lazy_css requested a blank page until custom CSS is checked: ${ blank_until_custom_css }`, css )

    // Force a blank page until the (potential) custom CSS is loaded?
    if( blank_until_custom_css && css == 'loading' ) return

    return <Main className={ `${ className } global_container` } { ...props }>
        { show_bookmark && <StyledBookmark /> }
        { hide_background ? '' : <BackgroundImage id="global_background_image" generic_styles={ generic_loading_styles } src={ background } key='background' /> }
        { children }
        <Style styles={ css } />
    </Main>
}