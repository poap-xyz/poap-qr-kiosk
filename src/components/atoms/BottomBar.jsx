import styled, { keyframes } from 'styled-components'

const slideIn = keyframes`
	0% {
		transform: translateY(100%);
	}
	100% {
		transform: translateY(0%);
	}
`

const slideOut = keyframes`
	0% {
		transform: translateY(0%);
	}
	90% {
		transform: translateY(0%);
	}
	100% {
		transform: translateY(100%);
	}
`

export default styled.aside`
	position: fixed;
	left: 0;
	bottom: 0;
	transform: translateY( 100% );
	width: 100%;
	text-align: center;
	background: ${ ( { theme, success } ) => success ? theme.colors.primary : theme.colors.accent };
	p {
		color: white;
	}

	// Animations
	animation-fill-mode: forwards;
	animation-duration: ${ ( { success } ) => success ? '3s' : '.5s' };
	animation-name: ${ ( { success, animate=false } ) => animate && ( success ? slideOut : slideIn ) };
`