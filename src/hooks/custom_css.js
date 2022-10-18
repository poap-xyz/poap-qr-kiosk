import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import { log } from "../modules/helpers"
import { useEvent, useLocalstoredEvent } from "./events"
import { useCodeMetadata } from "./printed_qrs"

export const useCustomCSS = (  ) => {

    const [ css, set_css ] = useState( '' )

    // Get event ID from different sources
	const location = useLocation()

	// Event ID form url
	const { eventId: routeEventId, claim_code } = useParams()

	// Event ID from code
	const { event: remote_event_by_code } = useCodeMetadata( claim_code )

	// Event ID from pushed state
	const { eventId: stateEventId, pathname } = location
	const custom_css_paths = [
		'/event/',
		'/claim/',
		'/static/claim'
	]
	const should_grab_css = !!custom_css_paths.find( path => pathname?.includes( path ) )

	// Load event details by id in case there is custom css
	const local_store_event_id = useLocalstoredEvent( !should_grab_css )
	const event_id = local_store_event_id || stateEventId || routeEventId || remote_event_by_code?.id
	const event = useEvent( event_id, !should_grab_css )

	useEffect( () => {

        if( event?.css && event?.css != css ) {
            log( `Received new event with custom CSS: `, event )
            set_css( event.css )
        }

    }, [ event ] )

    return css

}