import React from 'react'
import { ThemeProvider } from 'styled-components'

const theme = {
	colors: {
		primary: '#8076fa',
		text: 'rgb(77, 86, 128)',
		accent: 'rgb( 248, 117, 136 )',
		hint: 'rgba( 0, 0, 0, .4 )',
		backdrop: 'rgba( 0, 0, 0, .05 )'
	}
}

export default props => <ThemeProvider { ...props } theme={ theme } />