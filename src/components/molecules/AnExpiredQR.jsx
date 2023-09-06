import React from 'react'
import styled from 'styled-components'


import { ReactComponent as ExpiredIcon } from '../../assets/ExpiredQR.svg'

import { ReactComponent as NoCodesIcon } from '../../assets/NocodesQR.svg'

const ExpiredSVG = styled( ExpiredIcon )`
    margin: 0;
`

const NoCodesSVG = styled( NoCodesIcon )`
    margin: 0;
`

const ExpiredQR = ( { status } ) => {
    return (
        <>
            { status === 'expired' && <ExpiredSVG /> }
            { status === 'noCodes' && <NoCodesSVG /> }
        </>
    )
}

export default ExpiredQR