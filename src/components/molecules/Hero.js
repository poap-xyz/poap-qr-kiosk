import styled from 'styled-components'
import Section from '../atoms/Section'

export default styled( Section )`
	width: 100%;
	min-height: 80vh;
	align-items: flex-start;
	& h1 {
		margin-bottom: .5rem;
		text-align: left;
	}
	& * {
		max-width: 750px;
	}
	& p {
		margin: 0 0 4rem;
	}
`