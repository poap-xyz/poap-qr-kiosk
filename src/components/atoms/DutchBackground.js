import styled from 'styled-components'

// Image that behaves like a background image
import logo from '../../assets/illustrations/Illustration_Cities_Amsterdam.svg'

const BackgroundImage = styled.img.attrs( ( { src, generic_styles } ) => ( {
    src: generic_styles ? undefined : src || logo } ) )`
    position: absolute;
    bottom: 0;
    z-index: -1;
    width: 100%;
    opacity: 0.75;
`

export default BackgroundImage