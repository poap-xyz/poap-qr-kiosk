import { useEffect, useState } from 'react'
import { useIsOnline } from '../../hooks/network'
import QR from '../atoms/QR'

export default function AnnotatedQR( props ) {

    const { ping, online, bad_connection } = useIsOnline()
    const [ color, set_color ] = useState( 'black' )

    useEffect( () => {

        if ( !online ) return set_color( 'red' )
        if ( ping != Infinity && bad_connection ) return set_color( 'orange' )
        set_color( 'black' )

    }, [ online, bad_connection ] )

    return <QR { ...props } fgColor={ color } />

}