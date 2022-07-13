import { useState } from "react";
import Button from "../atoms/Button";
import Container from "../atoms/Container";
import Input from "../atoms/Input";
import Main from "../atoms/Main";
import { H1 } from "../atoms/Text";

export default function StaticClaimAdmin() {

    const [ drop_id, set_drop_id ] = useState( '' )
    const [ secret_code, set_secret_code] = useState( '' )
    const [ auth_code, set_auth_code] = useState( '' )

    async function export_drop() {

    }

    return <Container>

        <Main align='flex-start' width='600px'>

            <H1>Static QR Drop Export</H1>
            <Input type='text' value={ drop_id } onChange={ ( { target } ) => set_drop_id( target.value ) } label='Drop ID' info='The event ID of your drop, this can be found in the confirmation email' />
            <Input type='text' value={ secret_code } onChange={ ( { target } ) => set_secret_code( target.value ) } label='Drop Secret Edit Code' info='The secret edit code of your drop, this can be found in the confirmation email' />
            <Input type='text' value={ auth_code } onChange={ ( { target } ) => set_auth_code( target.value ) } label='Static QR autentication code' info='The secret edit code of your drop, this can be found in the confirmation email' />
            <Button onClick={ export_drop }>Export CSV</Button>

        </Main>

    </Container>
}