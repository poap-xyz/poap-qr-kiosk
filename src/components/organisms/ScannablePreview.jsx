import { Container, Sidenote } from "@poap/poap-components"
import { useEvent } from "../../hooks/events"
import Section from "../atoms/Section"
import { Col, Row } from "../atoms/Grid"
import { useTranslation } from "react-i18next"
import Image from "../atoms/Image"
import FlatCard from "../molecules/FlatCard"
import EventQR from "./EventQR"

export default function ScannablePreview( { event_id } ) {

    const event = useEvent( event_id )
    const { t } = useTranslation()


    return <Section>
        <Container>
            <FlatCard padding="2rem" align="center" justify="center" width='650px'>

                <Row gap="2rem" width="100%" align="center" justify="center">

                    <Col size='3' align='center'>
                        <EventQR margin="2rem 0" size={ 200 } event_id={ event_id } />
                    </Col>

                    <Col align="center" justify="center" size='3'>
                        <Image height="200px" width="200px" padding="0" margin="0" src={ event?.event?.image_url } />
                        { event && <Sidenote align="center" margin='1rem 0'>{ t( 'eventView.display.claimed', { available: event.codes - event.codesAvailable, codes: event.codes } ) }</Sidenote> }
                    </Col>

                </Row>

            </FlatCard>
        </Container>
    </Section>

}