import styled from 'styled-components'

export default styled.button`
	padding:  1rem 2rem;
	margin: .5rem;
	border: 2px solid ${ ( { color='primary', theme } ) => theme.colors[ color ] || color };
	color: ${ ( { color='primary', theme } ) => theme.colors[ color ] || color };
	font-size: 1rem;
	background: ${ ( { background='none' } ) => background };
	border-radius: 5px;
	&:hover {
		cursor: pointer;
	}
`
