import { useEffect, useState } from "react"
import useInterval from "use-interval"
import { remote_ping } from "../modules/firebase"
import { log, wait } from "../modules/helpers"

export function useIsOnline() {

    // ///////////////////////////////
	// State handling
	// ///////////////////////////////
	const [ online, set_online ] = useState( true )
	const [ was_offline, set_was_offline ] = useState(  )
    const [ ping, set_ping ] = useState( 0 )
    const max_ping_ms = 1000 * 5
    const ping_interval_ms = 1000 * 10

	// ///////////////////////////////
	// Lifecycle handling
	// ///////////////////////////////

	// Handle network changes
	useEffect( () => {

		log( `Setting network listeners` )

		const handleOnline = () => {
			log( 'Browser went online' )
			set_online( true )
		}

		const handleOffline = () => {
			log( 'Browser went offline' )
			set_online( false )
			set_was_offline( true )
		}

		window.addEventListener( 'online', handleOnline )

		window.addEventListener( 'offline', handleOffline )

		return () => {
			log( 'Removing network listeners' )
			window.removeEventListener( 'online', handleOnline )
			window.removeEventListener( 'offline', handleOffline )
		}

	}, [] )

    // Periodic ping check
    useInterval( (  ) => {

        let cancelled = false;
    
        ( async () => {
    
            try {
    
                const start = Date.now()
                await Promise.race( [
                    remote_ping(),
                    wait( max_ping_ms ).then( f => log( `🔔 Ping timed out at ${ max_ping_ms }ms` ) )
                ] )
                const end = Date.now()
                log( `🔔 Ping concluded at ${ end }, total: ${ end - start } ` )
                if( !cancelled ) set_ping( end - start )
    
            } catch( e ) {
                log( `🔔 Unable to ping: `, e )
                set_ping( Infinity )
            }
    
        } )( )
    
        return () => cancelled = true
    
    }, ping_interval_ms, true )

    return { online, was_offline, ping, bad_connection: ping > max_ping_ms }

}