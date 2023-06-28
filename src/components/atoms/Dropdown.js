import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'

// import Label from '../../atoms/Label'
// import { ReactComponent as ChevronIcon } from '../../../assets/icons/Dropdown_chevron.svg'

const DropdownContainer = styled.div`
    width: 100%;
    position: relative;
    margin-bottom: var(--spacing-3);
`


const DropdownHeader = styled.div`
width: 100%;
    height: var(--spacing-7);
    margin: 0 1px;
    padding: var(--spacing-2) var(--spacing-7) var(--spacing-2) var(--spacing-3);
    color: var(--primary-600);
    background: var(--white);
    border: 1px solid var(--primary-300);
    border-radius: 8px;
    box-sizing: border-box;
    font-family: var(--ff-primary);
    font-size: var(--fs-xs);
    line-height: var(--lh-2xs);
    cursor: pointer;
    z-index: 1;

    &:enabled {
        &:focus,
        &:hover {
        outline: 0;
        margin: 0;
        border: solid 2px var(--primary-300);
        }

        &:focus {
        box-shadow: 0 0 0 3px var(--secondary-6);
        }
    }

    &:disabled {
        color: var(--text-placeholder);
        background-color: var(--primary-100);
    }

    ${ props => props.success && css`
        border: solid 1px var(--success-400);
        margin: 0 1px;
    ` }

    ${ props => props.error && css`
        border: solid 1px var(--error-400);
        margin: 0 1px;
    ` }

    ${ props => props.prefixWidth && css`
        padding-left: ${ props.prefixWidth };
    ` }

    ${ props => props.leftHeaderIcon && css`
        padding-left: var(--padding-left);
    ` }
`

const DropDownListContainer = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: var(--spacing-2);
    padding: 0;
    list-style: none;
    z-index: 1;
    background: var(--white);
    border: 1px solid var(--primary-600);
    border-radius: var(--spacing-3);
    box-shadow: 0 4px 0 rgba(var(--primary-300-rgb), 0.25);
    max-height: 200px;
    width: 100%;
    overflow-y: auto;
`

const ListItem = styled.div`
    cursor: pointer;
    padding: var(--spacing-3) var(--spacing-4);
    margin: 0 var(--spacing-1);
    border-radius: 8px;
    color: var(--text-heading-2);

    &:first-child {
        margin-top: var(--spacing-1);
    }

    &:last-child {
        margin-bottom: var(--spacing-1);
    }

    &:hover {
        background: var(--primary-100);
    }

    ${ props => props.selected && css`
        color: var(--text-heading-2);
        background: var(--primary-200);

        &:hover {
            background: var(--primary-200);
        }
    ` }
`

// const StyledChevronIcon = styled( ChevronIcon )`
//     position: absolute;
//     right: var(--spacing-2);
//     top: 50%;
//     transition: transform 0.3s ease;
// `

export const Dropdown = ( { id, label, options, placeholder, toolTip, required, optional, handleOptionSelect } ) => {
    const [ selectedOption, setSelectedOption ] = useState( placeholder ? null : options[0] )
    const [ isOpen, setIsOpen ] = useState( false )

    const onOptionClicked = ( value ) => () => {
        setSelectedOption( value )
        setIsOpen( false )
        handleOptionSelect( value )
    }

    return (
        <DropdownContainer>
            { /* { label && 
            <Label htmlFor={ id } label={ label } labelType={ required && 'required' || optional && 'optional' } toolTip={ toolTip }>
                { label }
            </Label> } */ }
            <DropdownHeader onClick={ () => setIsOpen( !isOpen ) }>
                { selectedOption ? selectedOption.label : placeholder }
            </DropdownHeader>
            { isOpen && 
            <DropDownListContainer>
                { options.map( ( option ) => 
                    <ListItem onClick={ onOptionClicked( option ) } key={ option.value }>
                        { option.label }
                    </ListItem>
                ) }
            </DropDownListContainer> }
        </DropdownContainer>
    )
}

