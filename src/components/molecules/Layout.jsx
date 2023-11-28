import { Header, POAPProductTitle, POAPProfileMenu, Footer } from "@poap/poap-components";
import Main from "../atoms/Main";
import BackgroundImage from "../atoms/DutchBackground";

export const Layout = ({
	hide_header,
	hide_footer,
	header_show_help = true,
	hide_background,
	connected_user,
	generic_loading_styles,
	background_src,
	children,
	...props
}) => {
	return (
		<>
			{/* Header */}
			{!hide_header && (
				<Header
					leftColumn={<POAPProductTitle productName="Kiosk" beta />}
					rightColumn={
						<POAPProfileMenu
							show_help={header_show_help}
							help_url="https://poap.zendesk.com/"
						/>
					}
				/>
			)}

			{/* Main body */}
			<Main {...props}>
				{children}
				{hide_background ? (
					""
				) : (
					<BackgroundImage
						id="global_background_image"
						generic_styles={generic_loading_styles}
						src={background_src}
						key="background"
					/>
				)}
			</Main>
			{hide_footer ? "" : <Footer />}
		</>
	);
};

export default Layout;
