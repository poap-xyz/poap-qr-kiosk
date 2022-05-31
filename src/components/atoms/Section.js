import styled from 'styled-components'

export default styled.section`
	padding: ${ ( { padding } ) => padding || '1rem 0' };
	margin: ${ ( { margin } ) => margin || '1rem 0' };
	display: flex;
	flex-direction: ${ ( { direction } ) => direction || 'column' };
	width: ${ ( { width } ) => width || '100%' };
	height: ${ ( { height } ) => height || 'initial' };
	max-width: 100%;
	flex-wrap: wrap;
	align-items: ${ ( { align } ) => align || 'center' };
	justify-content: ${ ( { justify } ) => justify || 'center' };
`