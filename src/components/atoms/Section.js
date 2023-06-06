import styled from 'styled-components'

export default styled.section`
	position: relative;
	z-index: 1;
	min-height: ${ ( { height } ) => height || 'initial' };
	max-height: 100%;
	max-width: ${ ( { maxWidth } ) => maxWidth || '' };
	padding: ${ ( { padding } ) => padding || 'var(--spacing-4) 0 var(--spacing-4) 0' };
	margin: ${ ( { margin } ) => margin || '' };
`