import styled from 'styled-components'

export default styled.a`
	padding:  1rem 2rem;
	margin: ${ ( { margin } ) => margin || '.5rem' };
	border: 2px solid ${ ( { color='primary', theme } ) => theme.colors[ color ] || color };
	color: ${ ( { color='primary', theme } ) => theme.colors[ color ] || color };
	font-size: 1rem;
	text-decoration: none;
	background: ${ ( { background='none' } ) => background };
	border-radius: 5px;
	&:hover {
		cursor: pointer;
	}
`
