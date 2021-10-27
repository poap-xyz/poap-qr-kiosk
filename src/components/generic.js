import React from 'react'

export const Container = ( { children, props } ) => <div { ...props } className="container">
	
	{ children }

</div>

export const Loading = ( { children, message } ) => <Container>
	
	<div className="loading">
			
		<div className="lds-dual-ring"></div>
		{ message && <p>{ message }</p> }
		{ children }

	</div>

</Container>