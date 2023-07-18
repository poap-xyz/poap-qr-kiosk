import { Text, Button, Container } from '@poap/poap-components'

import styled from 'styled-components'

const FormFooterContainer = styled.div`
    background-color: var(--white);
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    border-top: 0.2rem solid var(--primary-300);
    z-index: 99;
`

const Wrapped = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--spacing-4);
    height: var(--spacing-10);
`

export const FormFooter = ( { children, ...props } ) => {

    return <FormFooterContainer>
        <Container>
            <Wrapped>
                { children }
            </Wrapped>
        </Container>
    </FormFooterContainer>


}

export default FormFooter