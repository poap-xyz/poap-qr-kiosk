import React from 'react'

// Visual
import BottomBar from '../atoms/BottomBar'
import { Text } from '../atoms/Text'

// Functionality
import { useIsOnline } from '../../hooks/network'


// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function ComponentName( ) {

    const { online, was_offline, bad_connection } = useIsOnline(  )

    // ///////////////////////////////
    // Render component
    // ///////////////////////////////
    return <BottomBar animate={ was_offline || bad_connection } success={ online && !bad_connection }>
        <Text align="center">
            Network { online ? 'on' : 'off' }line { online && `(${ bad_connection ? 'unstable' : 'stable' } connection)` }
        </Text>
    </BottomBar>

}