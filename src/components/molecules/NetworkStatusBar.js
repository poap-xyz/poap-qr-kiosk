import React, { useState, useEffect } from 'react'

// Visual
import BottomBar from '../atoms/BottomBar'
import { Text } from '../atoms/Text'

// Functionality
import { log, catcher } from '../../modules/helpers'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

	// ///////////////////////////////
	// State handling
	// ///////////////////////////////
	const [ online, setOnline ] = useState( true )

	// Only show the bar after the interface has been offline at least once, otherwise the bar shows on load
	const [ wasoffline, setWasoffline ] = useState(  )

	// ///////////////////////////////
	// Lifecycle handling
	// ///////////////////////////////

	// Handle network changes
	useEffect( () => {

		log( `Setting network listeners` )

		const handleOnline = () => {
			log( 'Browser went online' )
			setOnline( true )
		}

		const handleOffline = () => {
			log( 'Browser went offline' )
			setOnline( false )
			setWasoffline( true )
		}

		window.addEventListener( 'online', handleOnline )

		window.addEventListener( 'offline', handleOffline )

		return () => {
			log( 'Removing network listeners' )
			window.removeEventListener( 'online', handleOnline )
			window.removeEventListener( 'offline', handleOffline )
		}

	}, [] )

	// ///////////////////////////////
	// Render component
	// ///////////////////////////////
	return <BottomBar animate={ wasoffline } success={ online }>
		<Text align="center">
			Network { online ? 'On' : 'Off' }line!
		</Text>
	</BottomBar>

}