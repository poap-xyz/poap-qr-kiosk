import styled from 'styled-components'
import { mixin } from '@poap/poap-components'

import { ReactComponent as HeroBG } from '../../assets/decorations/hero-lined-bg.svg'
import { ReactComponent as FooterBG } from '../../assets/decorations/footer-lined-bg.svg'
import { ReactComponent as FooterDecoLeft } from '../../assets/decorations/footer-deco-left.svg'
import { ReactComponent as FooterDecoRight } from '../../assets/decorations/footer-deco-right.svg'
import { ReactComponent as GirlQR } from '../../assets/illustrations/Girl_holding_phoneQR.svg'
import { ReactComponent as GroupPhone } from '../../assets/illustrations/Group_holding_phones.svg'
import { ReactComponent as LineImg } from '../../assets/decorations/hero-full-width-line.svg'
import { ReactComponent as FullWidthBackgroundImage } from '../../assets/illustrations/Illustration_Cities_Amsterdam_FullWidth.svg'
import BackgroundImage from '../atoms/DutchBackground'

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
    z-index: 0;
    ${ mixin.sm_down`
        max-width: 100%;
        max-height: 300px;
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
    ` }
    ${ mixin.sm_up`
        margin-left: -5rem;
        margin-top: 3rem;
    ` }
`

export const GroupPhoneImage = styled( GroupPhone )`
    position: relative;
    z-index: 0;
    height: 100%;
    max-width: 100%;
`

export const FullLine = styled( LineImg )`
    width: 100%;
    position: absolute;
    bottom: 6rem;
`

export const FooterImage = styled( FooterBG )`
    position: absolute;
    left: 0;
    bottom: -1px;
    z-index: 0;
    ${ mixin.sm_down`
        width: 100%;
        max-height: 100%;
    ` }
`

export const FooterDecorationLeft = styled( FooterDecoLeft )`
    position: absolute;
    bottom: -5rem;
    left: 0;
`

export const FooterDecorationRight = styled( FooterDecoRight )`
    position: absolute;
    top: 0;
    right: 0;
`

export const StyledDutchBackground = styled( BackgroundImage )`
    max-width: 1640px;
    left: 0;
    right: 0;
    margin: 0 auto;
    z-index: 0;
`

export const StyledDutchBackgroundFullWidth = styled( FullWidthBackgroundImage )`
    position: absolute;
    width: 100%;
    max-width: 1640px;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0 auto;
    z-index: 0;
    opacity: 0.75;
`