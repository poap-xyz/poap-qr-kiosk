import React from 'react'
import { useTranslation } from 'react-i18next'

import styled from 'styled-components'

const Switch = styled.select`
	position: absolute;
	right: .5rem;
	top: .5rem;
	border: 0;
	font-size: 22px;
`

export default ( { ...props } ) => {

	const { i18n } = useTranslation()

	const options = [
		{
			label: '🇺🇸',
			value: 'en',
		},
		{
			label: '🇳🇱',
			value: 'nl',
		},
	]

	return <Switch type='dropdown' value={ i18n.language } onChange={ ( { target } ) => i18n.changeLanguage( target.value ) }>
		{options.map( ( option ) => (
			<option key={option.value} value={option.value}>{option.label}</option>
		) )}

	</Switch>

}