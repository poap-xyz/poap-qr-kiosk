import { useEffect, useState } from "react"
import { listen_to_claim_challenge } from "../modules/firebase"
import { log } from "../modules/helpers"

// Listens to a challenge, if the challenge doc returns no data, returns a deleted flag
export const useChallenge = challenge_code => {

    const [ challenge, set_challenge ] = useState()

    // Listen to challenge data
    useEffect( () => {

        if( !challenge_code ) return
        log( `Listening to challenge document for ${ challenge_code }` )

        // Listen to challenge data
        return listen_to_claim_challenge( challenge_code, challenge_data => {
            log( `Challenge data received: `, challenge_data )
            if( challenge_data ) set_challenge( challenge_data )
            if( !challenge_data ) set_challenge( prev => ( { ...prev, deleted: true } ) )
        } )

    }, [ challenge_code ] )

    return challenge

}