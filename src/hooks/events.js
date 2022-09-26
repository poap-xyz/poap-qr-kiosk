import { useEffect, useState } from "react"
import { listenToEventMeta } from "../modules/firebase"
import { log } from "../modules/helpers"

export const useEvent = ( eventId ) => {

    const [ event, set_event ] = useState(  )

    useEffect( () => {
        if( eventId ) return listenToEventMeta( eventId, set_event )
    }, [ eventId ] )

    return event
}

export const useLocalstoredEvent = () => {

    const [ eventId, setEventId ] = useState( localStorage.getItem( 'cached_event_id' ) )

    useEffect( () => {

        const listener = window.addEventListener( 'storage', () => {

            const new_event_id = localStorage.getItem( 'cached_event_id' )
            if( new_event_id != eventId ) setEventId( new_event_id )

        } )

        return () => {
            window.removeEventListener( 'storage', listener )
        }

    } )

    return eventId

}