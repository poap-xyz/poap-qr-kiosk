import styled, { keyframes } from 'styled-components'

const dotAnimation1 = keyframes`
    0%, 100% {
        opacity: 0;
    }
    25%, 75%, 90% {
        opacity: 1;
    }
`

const dotAnimation2 = keyframes`
    0%, 50%, 100% {
        opacity: 0;
    }
    50%, 75%, 90% {
        opacity: 1;
    }
`

const dotAnimation3 = keyframes`
    0%, 75%, 100% {
        opacity: 0;
    }
    75%, 90% {
        opacity: 1;
    }
`

const Dot = styled.span`
    opacity: 0;
    animation-duration: 1s;
    animation-iteration-count: infinite;

    &:nth-child(1) {
        animation-name: ${ dotAnimation1 };
    }

    &:nth-child(2) {
        animation-name: ${ dotAnimation2 };
    }

    &:nth-child(3) {
        animation-name: ${ dotAnimation3 };
    }
`


const AnimatedDots = ( { children } ) => 
    <span>
        { children }
        <Dot>.</Dot>
        <Dot>.</Dot>
        <Dot>.</Dot>
    </span>


export default AnimatedDots
