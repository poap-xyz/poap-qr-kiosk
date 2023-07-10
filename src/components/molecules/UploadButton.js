
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useDropzone } from 'react-dropzone'

import { Label, Button, HeroIcon } from '@poap/poap-components'

const UploadBorderContainer = styled.div`
    margin-top: var(--spacing-4);
`

const ErrorMessage = styled.div`
    color: red;
`

export const UploadButton = ( { accept = 'text/csv, text/plain', id, label, required, optional, toolTip, onFileChange } ) => {

    // i18next hook
    const { t } = useTranslation()

    // Button states
    const [ files, setFiles ] = useState( [] )
    const [ errorMessage, setErrorMessage ] = useState( '' )
    const acceptObject = accept.split( ',' ).reduce( ( obj, mimeType ) => {
        mimeType = mimeType.trim()
        obj[mimeType] = []
        return obj
    }, {} )

    const onDrop = ( acceptedFiles, fileRejections ) => {
        if( fileRejections.length > 0 ) {
            const [ { errors } ] = fileRejections
            if( errors[0].code === 'file-invalid-type' ) {
                setErrorMessage( `${ t( 'messaging.upload.formatInvalid' ) }` )
            } else {
                setErrorMessage( errors[0].message )
            }
        } else {
            setFiles( acceptedFiles )
            onFileChange && onFileChange( acceptedFiles[0] ) // pass the first file to the parent
            setErrorMessage( '' )
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone( {
        accept: acceptObject,
        onDrop
    } )

    return (
        <>
            { label && <Label color='var(--primary-600)' htmlFor={ id } labelType={ required && 'required' || optional && 'optional' } toolTip={ toolTip }>{ label }</Label> }
            <UploadBorderContainer { ...getRootProps() }>
                <input { ...getInputProps() } />
                <Button leftIcon={ <HeroIcon icon='ArrowUpTrayIcon' color='#fff' /> }>
                    { isDragActive ? `${ t( 'messaging.upload.dragndrop' )  }` : `${ t( 'messaging.upload.standard' )  }` }
                </Button>
                { files.map( ( file ) =>
                    <div key={ file.name }>
                        <p>{ file.name }</p>
                    </div>
                ) }
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            </UploadBorderContainer>
        </>
    )
}
