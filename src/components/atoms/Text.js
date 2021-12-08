import styled from 'styled-components'

export const Text = styled.p`
	font-size: 1rem;
	margin: 1rem 0;
	line-height: 1.5rem;
	color: ${ ( { theme } ) => theme.colors.text };
	text-align: ${ ( { align } ) => align || 'left' }
`

export const H1 = styled.h1`
	font-size: 2.5rem;
	font-weight: 500;
	line-height: 1.2;
	font-family: 'Comfortaa', cursive, sans-serif;
	text-align: ${ ( { align } ) => align || 'left' };
	color: ${ ( { theme } ) => theme.colors.primary };
`

export const H2 = styled.h2`
	font-size: 1.5rem;
	margin: 0 0 1rem;
	line-height: 1.2;
	font-weight: 400;
	text-align: ${ ( { align } ) => align || 'left' };
	color: ${ ( { theme } ) => theme.colors.accent };
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
export const Sup = styled.sup`

`