import { useEffect, useState } from "react"
import { log } from "../../modules/helpers"

export default ( { styles } ) => {

    const [ sane_styles, set_sane_styles ] = useState( undefined )

    // Sanetise style input to protect against potential XSS
    useEffect( () => {

        if( !styles ) return set_sane_styles( undefined )
        const styles_without_tags = styles.replace( /<.*>/ig, '' )
        set_sane_styles( styles_without_tags )

    }, [ styles ] )

    
    if( !sane_styles ) return

    log( `Custom styles detected: `, sane_styles )
    return <style dangerouslySetInnerHTML={ { __html: sane_styles } } />

}