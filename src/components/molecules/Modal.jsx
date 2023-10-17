import { useEffect, useState } from 'react'
import ReactModal from 'react-modal'
import styled from 'styled-components'
import { serveToast } from './Toast'

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
    justify-content: center;
    overflow: scroll;
    padding: var(--spacing-3);
`

const Modal = styled( Section )`
    background: white;
    box-shadow: 0px 0 5px 2px rgba( 0, 0, 0, .1);
    padding: 2rem 0;
`

export default ( { children, open = true, showClose = false, ...props } ) => {

    // state for closebutton
    const [ isOpen, setIsOpen ] = useState( open )

    // function to close modal
    const closeModal = () => setIsOpen( false )

    // useEffect for closeButton

    // const { connect, connectors, error, isLoading, pendingConnector } = useConnect()

    // useEffect( () => {
    //     if( !error ) return
    //     log( `Connection error: `, error )
    //     serveToast( { message: `Wallet error: ${ error.message }`, type: 'error' } )
    // }, [ error ] )

    return <StyledModal ariaHideApp={ false } style={ { overlay: { background: 'none' } } } isOpen={ isOpen } { ...props }>

        <Modal width='500px' direction='column' align='center' justify='center'>
            { /* Close button for modal if showClose = true */ }
            { showClose && <CloseModal onClick={ closeModal } /> }

            { children }

        </Modal>

    </StyledModal>
}