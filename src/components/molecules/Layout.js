import { Header, POAPProductTitle, POAPProfileMenu, Footer } from '@poap/poap-components'
import Main from '../atoms/Main'

export const Layout = ( { hide_header, hide_footer, header_show_help = true, showBackground, connected_user, children, ...props } ) => {

    return <>

        { /* Header */ }
        { !hide_header && <Header 
            hide_help={ header_show_help } 
            leftColumn={ <POAPProductTitle productName='Kiosk' beta /> } 
            // rightColumn={ <POAPProfileMenu items={ items } connected_user={ connected_user } hide_help={ header_show_help === false } /> } 
        /> }

        { /* Main body */ }
        <Main showBackground={ showBackground } { ...props }>
            { children }
        </Main>
        { hide_footer ? '' : <Footer /> }
    </>


}

export default Layout