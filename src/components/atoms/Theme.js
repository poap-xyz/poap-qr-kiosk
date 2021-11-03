import React from 'react'
import { ThemeProvider } from 'styled-components'

const theme = {
	colors: {
		primary: '#8076fa',
		hint: 'rgba( 0, 0, 0, .4 )',
		backdrop: 'rgba( 0, 0, 0, .05 )'
	}
}

export default props => <ThemeProvider { ...props } theme={ theme } />