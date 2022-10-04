import styled, { keyframes } from 'styled-components'
import Container from '../atoms/Container'
import { Text } from '../atoms/Text'

const rotate = keyframes`
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
`

const Spinner = styled.div`
	
	display: inline-block;
	width: 80px;
	height: 80px;
	margin: 2rem;

	&:after {
		content: " ";
		display: block;
		width: 64px;
		height: 64px;
		margin: 8px;
		border-radius: 50%;
		border: 6px solid ${ ( { theme, generic_styles } ) => generic_styles ? 'black' : theme.colors.primary };
		border-color: ${ ( { theme, generic_styles } ) => generic_styles ? 'black' : theme.colors.primary } transparent ${ ( { theme, generic_styles } ) => generic_styles ? 'black' : theme.colors.primary } transparent;
		animation: ${ rotate } 1.2s linear infinite;
	}

`

export default ( { message, generic_styles, ...props } ) => <Container generic_styles={ generic_styles } { ...props }>
	
	<Spinner generic_styles={ generic_styles } />
	{ message && <Text id='loading_text' align="center">{ message }</Text> }

</Container>