import ReactModal from 'react-modal'
import styled from 'styled-components'

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