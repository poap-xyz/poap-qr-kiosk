import { mixin } from '@poap/poap-components'
import styled from 'styled-components'

export const Grid = styled.div`
    width: 100%;
    
`

export const Row = styled.div`

    max-width: 100%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 0;
    margin: ${ ( { margin = '0' } ) => margin };
    padding: ${ ( { padding = '0' } ) => padding };
    justify-content: ${ ( { justify } ) => justify || '' };
    align-items: ${ ( { align } ) => align || '' };

    ${ mixin.md_up`
		flex-direction: row;
        gap: ${ ( props ) => props.gap };
        margin: ${ ( { margin = '0' } ) => margin };
	` }
`

export const Col = styled.div`
    flex: ${ ( { size } ) => size || '1' };
    display: flex;
	flex-direction: ${ ( { direction } ) => direction || 'column' };
	align-items: ${ ( { align } ) => align || '' };
	justify-content: ${ ( { justify } ) => justify || '' };
    padding: ${ ( { padding = '0' } ) => padding };
`
