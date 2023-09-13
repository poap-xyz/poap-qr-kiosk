import { useEvent } from "../../hooks/events"
import AnnotatedQR from "../molecules/AnnotatedQR"
let { VITE_publicUrl } = import.meta.env

export default function EventQR( { event_id, size=256, ...props } ) {

    const event = useEvent( event_id )
    const force_appcheck_fail = window?.location?.href?.includes( 'FORCE_INVALID_APPCHECK' )

    return <AnnotatedQR
        color="var(--primary-800)"
        background="var(--primary-100)"
        size={ size }
        level="L"
        key={ event_id + event?.public_auth?.token }
        className='glow'
        data-code={ `${ event_id }/${ event?.public_auth?.token }` }
        value={ `${ VITE_publicUrl }/claim/${ event_id }/${ event?.public_auth?.token }${ force_appcheck_fail ? '?FORCE_INVALID_APPCHECK=true' : '' }` }
        { ...props }
    />
}