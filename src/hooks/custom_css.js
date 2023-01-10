import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import { log } from "../modules/helpers"
import { useEvent, useLocalstoredEvent } from "./events"
import { useCodeMetadata } from "./printed_qrs"

export const useCustomCSS = (  ) => {

    const [ css, set_css ] = useState( 'loading' )

    // Get event ID from different sources
	const location = useLocation()
	const { eventId: stateEventId, pathname } = location
	const custom_css_paths = [
		'/event/',
		'/claim/',
		'/static/claim'
	]
	const should_grab_css = !!custom_css_paths.find( path => pathname?.includes( path ) )
	const is_static_claim = pathname?.includes( '/static/claim' )

	// Event ID form url
	const { eventId: routeEventId, claim_code } = useParams()

	// Event ID from code
	const { event: remote_event_by_code, drop_meta } = useCodeMetadata( claim_code, !should_grab_css )


	// Load event details by id in case there is custom css
	const local_store_event_id = useLocalstoredEvent( !should_grab_css )
	const event_id = local_store_event_id || stateEventId || routeEventId || remote_event_by_code?.id
	const event = useEvent( event_id, !should_grab_css )

	/* ///////////////////////////////
	// Formulate CSS
	// /////////////////////////////*/
	const event_custom_css = event?.css
	const drop_id_custom_css = drop_meta?.custom_css
	const found_css = event_custom_css || drop_id_custom_css
	const css_to_use = `
	
		${ is_static_claim ? `
			/* Drop ID claim CSS */
			${ drop_id_custom_css || 'no_css_found {}' }
		` : '' }

		/* Event ID custom CSS */
		${ event_custom_css || 'no_css_found {}' }

	`
	if ( should_grab_css ) log( `Custom CSS for ${ event_id }: `, css_to_use )

	useEffect( () => {

		// If this is not a CSS path, exit
		if ( !should_grab_css ) return

		// If css found, and it is different from the state, set it to state
        if ( found_css && css_to_use != css ) {
            log( `Received new event with custom CSS` )
            set_css( css_to_use )
        }

		// If the event was loaded, but the css is empty, set the state to no css
		if ( event !== 'loading' && !event_custom_css && !drop_id_custom_css ) {
			log( `Event loaded, no CSS` )
			set_css( 'none' )
		}

    }, [ css_to_use ] )

    return css

}