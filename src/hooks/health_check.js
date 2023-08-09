import { useEffect, useState } from "react"
import { health_check, trackEvent } from "../modules/firebase"
import { dev, log, wait } from "../modules/helpers"
import { t } from "i18next"

export const useHealthCheck = () => {

    const [ healthy, set_healthy ] = useState( true )


    useEffect( (  ) => {

        let cancelled = false;
    
        ( async () => {
    
            try {
                
                // Wait before actually running the health check, in case of rerenders
                // It also reduces calls in CI
                await wait( 1000 )
                if( cancelled ) return log( `Health effect cancelled` )

                const { data: health } = await health_check()
                log( `Systems health: `, health )
                if( cancelled ) return log( `Health effect cancelled` )
                set_healthy( health?.healthy )
                if( !dev && !health?.healthy ) {
                    trackEvent( `claim_system_down` )
                    return alert( `${ t( 'messaging.health.maintenance' ) }` )
                }
    
            } catch ( e ) {
                log( `Error getting system health: `, e )
            }
    
        } )( )
    
        return () => cancelled = true
    
    }, [] )

    return healthy

}