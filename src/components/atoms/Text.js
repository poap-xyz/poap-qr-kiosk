import styled from 'styled-components'

export const Text = styled.p`
	margin: 1rem 0;
	text-align: ${ ( { align } ) => align || 'left' }
`

export const H1 = styled.h2`

`

export const Sidenote = styled.p`
	color: ${ ( { theme } ) => theme.colors.hint };
	font-style: italic;
	margin-top:  1rem;
	text-align: center;
`

export const Br = styled.span`
	width: 100%;
	margin: 2rem 0;
`