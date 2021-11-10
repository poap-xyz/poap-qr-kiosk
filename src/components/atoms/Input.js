import styled from 'styled-components'
import { useRef } from 'react'

const Input = styled.div`

	display: flex;
	flex-direction: column;
	margin: 1rem 0;
	width: 100%;
	
	& input {
		background: ${ ( { theme } ) => theme.colors.backdrop };
		border: none;
		border-left: 2px solid ${ ( { theme } ) => theme.colors.primary };
	}

	& input {
		padding: 1rem 2rem 1rem 1rem;
		width: 100%;
	}

	& label {
		opacity: .5;
		font-style: italic;
		margin-bottom: .5rem;
		display: flex;
		width: 100%;
		color: ${ ( { theme } ) => theme.colors.text };
		span {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: .9rem;
			margin-left: auto;
			font-style: normal;
			background: ${ ( { theme } ) => theme.colors.hint };
			color: white;
			border-radius: 50%;
			width: 20px;
			height: 20px;
		}
	}

`

export default ( { onChange, type, label, info, id, ...props } ) => {

	const { current: internalId } = useRef( id || `input-${ Math.random() }` )

	return <Input>

		{ label && <label htmlFor={ internalId }>{ label } { info && <span onClick={ f => alert( info ) }>?</span> }</label> }
		<input data-testid={ internalId } { ...props } id={ internalId } onChange={ onChange } type={ type || 'text' } />
		
	</Input>

}