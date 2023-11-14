import { PoapIcon, H3, Text, Link, Number, useViewport, Input } from '@poap/poap-components'
import { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import { formatDate, log } from '../../modules/helpers'

import { ReactComponent as SparklesIcon } from '../../assets/decorations/sparkles.svg'
import { ReactComponent as ShareWarningIcon } from '../../assets/illustrations/share_warning.svg'
import { clipboard } from '../../hooks/clipboard'

// Function to determine container styles based on the 'variation' prop
const MethodContainerStyles = ( variation ) => {
    switch ( variation ) {
    case 'primary':
        return css`
            background-color: #3498db;
            border-color: #2980b9;
        `
    default:
        return css`
            background: var(--white);
            box-shadow: -6px 8px 0 rgba(var(--primary-400-rgb),.25);
            border: 1px solid var(--dm-link-400);
        `
    }
}


export const SparklesImage = styled( SparklesIcon )`
    width: 16px;
    height: 16px;
`

const MethodContainer = styled.div`
    display: flex;
    padding: ${ ( { padding } ) => padding || '' };
    margin: ${ ( { margin } ) => margin || '0 0 var(--spacing-6) 0' };
    border-radius: 24px;
`

const MethodLabel = styled.div`
    display: flex;
    justify-content: center;
    padding-top: var(--spacing-4);
    width: 4rem;
    border-radius: 24px;
    background: var(--warning-100);
`

const IconContainer = styled.div`
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    color: var(--dm-link-400);
    background: var(--warning-300);
`

const MethodContent = styled.div`
    padding: var(--spacing-4) var(--spacing-4);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-3);
    width: 100%;
`

const ContentHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    justify-content: space-between;
    width: 100%;
`

const HeaderBar = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);

    @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
`

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const MintContainer = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-2);
`

const ButtonContainer = styled.div`
    display: flex;
    gap: var(--spacing-1);
    flex-wrap: wrap;
`

const RoundedButton = styled.button`
    display: flex;
    align-items: center;
    position: relative;
    border: 1px solid var(--primary-200);
    border-radius: 8px;
    padding: 8px;
    width: auto;
    background: transparent;
    font: inherit;
    line-height: normal;
    font-weight: 700;
    font-size: var(--fs-3xs);
    line-height: var(--fs-3xs);
    color: var(--primary-500);
    cursor: pointer;
    white-space: nowrap;
`

const WarningBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--spacing-1);
    padding: var(--spacing-3) var(--spacing-4) 0 var(--spacing-2) ;
    border-radius: 8px; 
    background: var(--neutral-100);
`

const EventMeta = styled.div`
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: .75rem;
    @media (min-width: 768px) {
        flex-direction: row;
        align-items: center;
    }
`

const MetaRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`

const MetaCol = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`

const MetaLink = styled( Link )`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    line-height: 1;
    /* font-size: 14px;
    font-weight: 500;
    display: inline-block;
    width: 150px; 
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    color: var(--neutral-500);
    line-height: 1; */
    span {
        text-decoration: none;
    }
`

const ClippedContent = styled.span`
    font-size: 14px;
    font-weight: 500;
    display: inline-block;
    width: 150px; 
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    color: var(--neutral-500);
    line-height: 1;
`


export const MethodCard = ( { event, eventLink, adminLink, onDelete, onRecalculate, variation, ...props } ) => {

    const { isMobile } = useViewport()

    const containerStyles = MethodContainerStyles( variation )
  
    // Use the styled components with dynamic styles
    const StyledMethodContainer = styled( MethodContainer )`
        ${ containerStyles }
    `

    
    // if no event return null
    if( !event ) return

    const expirationDate = formatDate( event.expires, 'nl-NL' )

    return <StyledMethodContainer>
        <MethodLabel>
            <IconContainer>
                <PoapIcon size={ isMobile ? '16' : '20' } icon='QRCodeIcon' color='var(--warning-500)' />
            </IconContainer>
        </MethodLabel>
        <MethodContent>
            <ContentHeader>
                <HeaderBar>
                    <TextContainer>
                        <H3 margin='0 0 var(--spacing-2) 0'>Kiosk</H3>
                        <MintContainer>
                            <SparklesImage/>
                            <Text margin='0'> Minted: <Number weight='700' color='var(--text-body-1)'>{ event.codes - event.codesAvailable }/{ event.codes }</Number></Text>
                        </MintContainer>
                    </TextContainer>
                    <ButtonContainer>
                        <RoundedButton onClick={ f => window.open( eventLink, '_blank' ) }>
                            <PoapIcon size='16' iconSet='outline' icon='ExternalLinkIcon' color='var(--primary-600)' margin='0 3px 0 0' />
                            Open kiosk
                        </RoundedButton>
                        <RoundedButton onClick={ onRecalculate }>
                            <PoapIcon size='16' iconSet='outline' icon='RefreshIcon' stroke='var(--primary-600)' margin='0 3px 0 0' />
                            Refresh counter
                        </RoundedButton>
                        <RoundedButton id='deleteEvent' onClick={ onDelete } >
                            <PoapIcon size='16' iconSet='outline' icon='TrashIcon' stroke='var(--primary-600)' margin='0 3px 0 0' />
                            Delete kiosk
                        </RoundedButton>
                    </ButtonContainer>
                </HeaderBar>
            </ContentHeader>
            <EventMeta>
                <MetaCol>
                    <Text margin='0' size='14px' lineHeight='1' color='var(--neutral-500)'>Kiosk:&nbsp;</Text> 
                    <MetaLink onClick={ () => clipboard( eventLink, 'Kiosk link copied to clipboard' ) }>
                        <ClippedContent margin='0' size='14px' weight='500'> { eventLink }</ClippedContent>
                        <PoapIcon size='16' iconSet='outline' icon='DocumentDuplicateIcon' stroke='var(--neutral-500)' margin='0 3px 0 0' />
                        <input id='admin-eventlink-public' readOnly type='text' value={ eventLink } style={ { display: 'none' } }/>
                    </MetaLink>
                </MetaCol>
                { !isMobile && <MetaRow><Text margin='0' size='12px' lineHeight='1' color='var(--warning-400)'>|</Text></MetaRow> }
                <MetaCol>
                    <Text margin='0' size='14px' lineHeight='1' color='var(--neutral-500)'>Kiosk expiry date:&nbsp;<strong>{ expirationDate.toLocaleString() }</strong></Text>

                </MetaCol>
            </EventMeta>
            <MetaRow>
                <Text margin='0' size='14px' lineHeight='1' color='var(--neutral-500)'>Admin link:&nbsp;</Text>
                <MetaLink onClick={ () => clipboard( adminLink, 'Admin link copied to clipboard' ) }>
                    <ClippedContent margin='0' size='14px' weight='500'> { adminLink }</ClippedContent>
                    <PoapIcon size='16' iconSet='outline' icon='DocumentDuplicateIcon' stroke='var(--neutral-500)' margin='0 3px 0 0' />
                    <input id='admin-eventlink-secret' readOnly type='text' value={ adminLink } style={ { display: 'none' } }/>
                </MetaLink>
            </MetaRow>
            <WarningBox>
                <ShareWarningIcon />
                <Text margin='-.75rem 0 0 .5rem' color='var(--neutral-500)' size='14px' lineHeight='1.3'>Never send your kiosk links to anyone!</Text>
            </WarningBox>
        </MethodContent>
        
    </ StyledMethodContainer>
    

}