import { useEffect, useState } from "react"
import { listen_to_document, check_code_status } from "../modules/firebase"
import { log } from "../modules/helpers"

export function useCodeMetadata( claim_code ) {

    const [ event, set_event ] = useState()
    const [ claimed, set_claimed ] = useState()
    const [ drop_meta, set_drop_meta ] = useState()

    // Get event meta from claim_code
    useEffect( (  ) => {

        let cancelled = false;
    
        ( async () => {
    
            try {
    
                // Get remote event data
                const { data } = await check_code_status( claim_code )
                log( `Received event meta for ${ claim_code }: `, data.event )
                if( cancelled || !data ) return

                // Set changed data to state
                if( event?.id !== data?.event?.id ) set_event( data.event )
                if( data.claimed !== claimed ) set_claimed( data.claimed )
    
            } catch( e ) {
                log( `Error getting event meta for `, claim_code, e )
            }
    
        } )( )
    
        return () => cancelled = true
    
    }, [ claim_code ] )

    useEffect( f => {

        // Log whether we can listen
        if( !event?.id ) return log( `No drop ID available for ${ claim_code }, doing nothing. Known meta: `, event )
        log( `Starting listener for static_drop_public/${ event.id }` )

        // Handle mock event listening for CI
        if( event.id.includes( `mock` ) ) {
            set_drop_meta( {} )
            return () => log( `Removed mock listener` )
        }

        // Return unlistener
        return listen_to_document( `static_drop_public`, `${ event.id }`, set_drop_meta )

    }, [ event?.id ] )

    const collated_metadata = {
        event,
        claimed,
        drop_meta
    }

    log( `New data for ${ claim_code }: `, collated_metadata )
    return collated_metadata

}