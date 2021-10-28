import React from 'react'
import logo from '../logo.svg'

export const Container = ( { children, props } ) => <div { ...props } className="container">
	
	{ children }

</div>

export const Loading = ( { children, message } ) => <Container>
	<img id='logo' src={ logo } />
	<div className="loading">
			
		<div className="lds-dual-ring"></div>
		{ message && <p>{ message }</p> }
		{ children }

	</div>

</Container>