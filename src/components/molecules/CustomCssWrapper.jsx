import { useCustomCSS } from "../../hooks/custom_css"
import Style from "../atoms/Style"

export default function CustomCssWrapper( { children } ) {

    const css = useCustomCSS()

    return <>

        { children }

        { css && <Style styles={ css } /> }

    </>
}