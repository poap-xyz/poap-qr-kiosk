import ReCAPTCHA from "react-google-recaptcha"
import ViewWrapper from '../atoms/ViewWrapper'
import { Text } from '../atoms/Text'
const { REACT_APP_recaptcha_v2_site_key } = process.env

export default ( { ...props } ) => <ViewWrapper>
    <Text>Please check the box below to proceed.</Text>
    <ReCAPTCHA sitekey={ REACT_APP_recaptcha_v2_site_key } { ...props } />
</ViewWrapper>