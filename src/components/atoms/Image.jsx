import styled from 'styled-components'

export default styled.img`
	width: ${ ( { width='100%' } ) => width };
	height: ${ ( { height='100%' } ) => height };
	padding: ${ ( { padding=0 } ) => padding };
`