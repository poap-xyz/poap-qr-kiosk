import ReCAPTCHA from "react-google-recaptcha"
import Container from '../atoms/Container'
import { Text } from '../atoms/Text'
const { REACT_APP_recaptcha_v2_site_key } = process.env

export default ( { ...props } ) => <Container>
	<Text>Please check the box below to proceed.</Text>
	<ReCAPTCHA sitekey={ REACT_APP_recaptcha_v2_site_key } { ...props } />
</Container>