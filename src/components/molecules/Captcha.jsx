import ReCAPTCHA from "react-google-recaptcha";
import ViewWrapper from "../molecules/ViewWrapper";
import { Text } from "../atoms/Text";
const { VITE_recaptcha_v2_site_key } = import.meta.env;

export default ({ ...props }) => (
	<ViewWrapper center>
		<Text>Please check the box below to proceed.</Text>
		<ReCAPTCHA sitekey={VITE_recaptcha_v2_site_key} {...props} />
	</ViewWrapper>
);
