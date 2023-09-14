import { Button, CardContainer, Container, Divider, H1, HeroIcon, Input, Text } from "@poap/poap-components"
import ViewWrapper from "../molecules/ViewWrapper"
import { ReactComponent as WelldoneIcon } from '../../assets/illustrations/well_done.svg'
import { useProbableMintAddress } from "../../hooks/minter"
import { useEffect, useState } from "react"

export default function MintPOAP() {

    const probable_user_address = useProbableMintAddress()
    const [ user_address, set_user_address ] = useState( probable_user_address )

    // If a probable address is found, and the user did not supply an address, set the address to state
    useEffect( (  ) => {

        if( !user_address && probable_user_address ) set_user_address( probable_user_address )

    }, [ probable_user_address ] )

    return <ViewWrapper center show_bookmark>
        <Container>
            <CardContainer width='400px' margin='0 auto'>
                <WelldoneIcon />
                <H1 align='center' size='var(--fs-lg)' margin='var(--spacing-5) 0 var(--spacing-1) 0'>Ready to mint your POAP</H1>
                <Divider outline margin='0 0 var(--spacing-6) 0' />
                <Input label="Address to mint the POAP to:" placeholder='Enter your POAP code' value={ user_address } />
                <Button onClick={ f => f } leftIcon={ <HeroIcon icon='sparkles' /> }>Collect your POAP</Button>

            </CardContainer>
        </Container>
    </ViewWrapper>

}