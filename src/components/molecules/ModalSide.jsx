import { useEffect, useState } from 'react'
import ReactModal from 'react-modal'
import styled from 'styled-components'
import { serveToast } from '../molecules/Toast'

import Section from '../atoms/Section'

import { ReactComponent as CloseIcon } from '../../assets/icons/Icon_close.svg'

export const CloseModal = styled( CloseIcon )`
    position: absolute;
    right: var(--spacing-3);
    top: var(--spacing-3);
    cursor: pointer;
`

export const StyledModal = styled( ReactModal )`
    height: 100%;
    width: 100%;
    border: none;
    opacity: 1;
    background-color: ${ ( { light } ) => light ? 'rgba(var(--white-rgb), 0.5)' : 'rgba(var(--primary-700-rgb),0.7)' };
    display: flex;
    align-items: center;
    justify-content: flex-end;
    overflow: scroll;
    /* padding: var(--spacing-3); */
`

const Modal = styled( Section )`
    background: white;
    box-shadow: 0px 0 5px 2px rgba( 0, 0, 0, .1);
    padding: 2rem 1rem;
    height: 100%;
    width: 100%;
    max-width: 450px;
`

export default ( { children, open = true, showClose = false, setIsOpen, ...props } ) => {

    // function to close modal
    const closeModal = () => setIsOpen( false )

    // useEffect for if the state of open is changed
    useEffect( () => setIsOpen( open ), [ open ] )

    return <StyledModal ariaHideApp={ false } style={ { overlay: { background: 'none' } } } isOpen={ open } { ...props }>

        <Modal width='500px' direction='column' align='center' justify='center'>
            { /* Close button for modal if showClose = true */ }
            { showClose && <CloseModal onClick={ closeModal } /> }

            { children }

        </Modal>

    </StyledModal>
}