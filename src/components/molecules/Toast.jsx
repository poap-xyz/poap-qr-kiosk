import React from 'react'
import toast, { Toaster } from 'react-hot-toast'
import styled, { css } from 'styled-components'

import { Expander, PoapIcon } from '@poap/poap-components'

import CloseIcon from "../../assets/icons/Icon_close.svg"

// Export Toaster
export { Toaster }

const StyledCloseIcon = styled( CloseIcon )`
    cursor: pointer;
    display: block;
    align-self: flex-start;
    
    // color
    rect {
        fill: var(--neutral-200);
    }
    path {
        fill: var(--neutral-500);
    }
    ${ ( { type } ) => type == 'blue' && css`
        rect {
            fill: var(--info-200);
        }
        path {
            fill: var(--info-500);
        }
	` }
    ${ ( { type } ) => type == 'error' && css`
        rect {
            fill: var(--error-200);
        }
        path {
            fill: var(--error-500);
        }
	` }
    ${ ( { type } ) => type == 'success' && css`
    rect {
            fill: var(--success-200);
        }
        path {
            fill: var(--success-500);
        }
	` }
    ${ ( { type } ) => type == 'warning' && css`
    rect {
            fill: var(--warning-200);
        }
        path {
            fill: var(--warning-500);
        }
	` }
`

const Content = styled.div`
    display: flex;
    padding: var(--spacing-2);
    align-items: flex-start;
    gap: var(--spacing-2);
    flex: 1 0 0;
`

const StyledToast = styled.div`
    display: flex;
    padding: var(--spacing-2);
    justify-content: center;
    align-items: center;
    gap: var(--spacing-2);
    font-size: 14px;
    font-weight: 500;
    border-radius: var(--spacing-4);
    border: 1px solid var(--neutral-200);
    background: var(--neutral-100);
    color: var(--primary-700);
    min-width: 250px;
    max-width: 400px;
`

const StyledToastBlue = styled( StyledToast )`
    background-color: var(--info-100);
    border: 1px solid var(--info-200);
`

const StyledToastRed = styled( StyledToast )`
    background-color: var(--error-100);
    border: 1px solid var(--error-200);
`

const StyledToastYellow = styled( StyledToast )`
    background-color: var(--warning-100);
    border: 1px solid var(--warning-200);
`

const StyledToastGreen = styled( StyledToast )`
    background-color: var(--success-100);
    border: 1px solid var(--success-200);
`

export const serveToast = ( { message, type, icon, close, duration, position } ) => {

    let StyledToastComponent = StyledToast

    const toastType = type || 'default'
    const toastDurations = {
        default: 4000,
        blue: 4000,
        error: 4000,
        success: 2000,
        warning: 4000
    }

    // Determine the StyledToastComponent based on toastType
    switch ( toastType ) {
    case 'blue':
        StyledToastComponent = StyledToastBlue
        break
    case 'error':
        StyledToastComponent = StyledToastRed
        break
    case 'warning':
        StyledToastComponent = StyledToastYellow
        break
    case 'success':
        StyledToastComponent = StyledToastGreen
        break
    default:
        StyledToastComponent = StyledToast
    }

    // Convert duration to number and validate, else fall back to default duration for toastType
    let finalDuration = ( typeof duration === 'string' ? Number( duration ) : duration ) || toastDurations[toastType]

    // If the result is NaN (e.g., if duration was a non-numeric string), fall back to the default duration based on toastType
    if( isNaN( finalDuration ) ) {
        finalDuration = toastDurations[toastType]
    }

    const finalPosition = position || 'top-center'

    return toast.custom( ( t ) => <StyledToastComponent data-toast-type={ toastType }>
        <Content>
            { icon && <PoapIcon icon={ icon }/> }
            <Expander>{ message }</Expander>
        </Content>
        { close && <StyledCloseIcon type={ toastType } data-toast-close={ toastType } onClick={ () => toast.dismiss( t.id ) } /> }
    </StyledToastComponent>,
    { duration: finalDuration, position: finalPosition } 
    )
}