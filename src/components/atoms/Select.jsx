import styled from 'styled-components'
import { useRef } from 'react'
import { Label } from '@poap/poap-components'

const Input = styled.div`

    & select {
        width: 100%;
        height: var(--spacing-7);
        margin: 0 1px;
        padding: var(--spacing-2);
        padding-right: var(--spacing-7);
        color: var(--primary-600);
        background: var(--white);
        border: 1px solid var(--primary-300);
        border-radius: 8px;
        font-family: var(--ff-primary);
        font-size: var(--fs-xs);
        line-height: var(--lh-2xs);
        appearance: none;
        cursor: pointer;
        &:enabled {
            &:focus,
            &:hover {
                outline: 0;
                box-shadow: inset 0 0 0 1px var(--primary-300);
            }
            &:focus {
                border-width: 1px;
                box-shadow: 0 0 0 3px var(--secondary-6);
            }
        }
        &:disabled {
            cursor: default;
            color: var(--text-placeholder);
            background-color: var(--primary-100);
        }
    }
`

const SelectContainer = styled.div`
    position: relative;
    margin-bottom: var(--spacing-4);
`

export default ( { onChange, type, label, toolTip, required, optional, id, title, onClick, options, ...props } ) => {

    const { current: internalId } = useRef( id || `input-${ Math.random() }` )

    return <Input onClick={ onClick } { ...props }>

        { label && 
            <Label htmlFor={ internalId } label={ label } labelType={ required ? 'required' : optional ? 'optional' : '' } toolTip={ toolTip } weight='500'>
                { label }
            </Label> }

        <SelectContainer>
            <select id={ id } { ...props } onChange={ onChange }>
                { options.map( ( option, index ) => <option key={ index } value={ option.value }>{ option.label }</option> ) }
            </select> 
        </SelectContainer>
            
    </Input>

}