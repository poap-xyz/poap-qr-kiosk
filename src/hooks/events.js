import { useEffect, useState } from "react"
import { listenToEventMeta, listen_to_claim_challenge } from "../modules/firebase"
import { log } from "../modules/helpers"

export const useEvent = ( eventId, do_nothing=false ) => {

    const [ event, set_event ] = useState(  )

    useEffect( () => {
        if( eventId && !do_nothing ) return listenToEventMeta( eventId, set_event )
    }, [ eventId ] )

    return event
}

export const useEventOfChallenge = ( challenge_code ) => {

    const [ event_id, set_event_id ] = useState(  )
    const [ event, set_event ] = useState(  )

    useEffect( () => listen_to_claim_challenge( challenge_code, challenge => {
        if( challenge?.eventId ) set_event_id( challenge?.eventId )
    } ), [ challenge_code ] )
    useEffect( () => listenToEventMeta( event_id, remote_event => {
        if( remote_event ) set_event( remote_event )
    } ), [ event_id ] )

    return event
}

export const useLocalstoredEvent = ( do_nothing=false ) => {

    const [ eventId, setEventId ] = useState( localStorage.getItem( 'cached_event_id' ) )

    useEffect( () => {

        if( do_nothing ) return

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