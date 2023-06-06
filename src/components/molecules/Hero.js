import styled from 'styled-components'
import { mixin } from '@poap/poap-components'

import { ReactComponent as HeroBG } from '../../assets/decorations/hero-lined-bg.svg'
import { ReactComponent as FooterBG } from '../../assets/decorations/footer-lined-bg.svg'
import { ReactComponent as GirlQR } from '../../assets/illustrations/Girl_holding_phoneQR.svg'

export const HeroImage = styled( HeroBG )`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    max-height: 100%;
    z-index: 0;
`

export const GirlQRImage = styled( GirlQR )`
    position: relative;
    margin-left: -5rem;
`

export const FooterImage = styled( FooterBG )`
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    max-height: 100%;
`