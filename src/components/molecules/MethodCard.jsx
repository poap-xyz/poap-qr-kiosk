import { PoapIcon, H3, Text, Number } from '@poap/poap-components'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { log } from '../../modules/helpers'

import { ReactComponent as SparklesIcon } from '../../assets/decorations/sparkles.svg'
import { ReactComponent as ShareWarningIcon } from '../../assets/illustrations/share_warning.svg'

export const HeroImage = styled( SparklesIcon )`
    width: 16px;
    height: 16px;
`

// TODO create color array for Panel color scheme

const MethodContainer = styled.div`
    display: flex;

    padding: ${ ( { padding } ) => padding || '' };
    margin: ${ ( { margin } ) => margin || '0 0 var(--spacing-6) 0' };
    border-radius: 24px;

    background: var(--white);
    box-shadow: -6px 8px 0 rgba(var(--primary-400-rgb),.25);
    border: 1px solid var(--dm-link-400);
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

    /* min height 48rem where rem = 10px */
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const MintContainer = styled.div`
    display: flex;
    align-items: center;
`

const ButtonContainer = styled.div`
    display: flex;
    gap: var(--spacing-1);
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



export const MethodCard = ( { event, eventLink, adminLink, safelyDeleteEvent, ...props } ) => {

    // if no event return null
    if( !event ) return
    log( 'MethodCard event', event )

    return <MethodContainer>
        <MethodLabel>
            <IconContainer>
                { /* TODO add resizing to 16px on mobile */ }
                <PoapIcon size='20' icon='QRCodeIcon' color='var(--warning-500)' />
            </IconContainer>
        </MethodLabel>
        <MethodContent>
            <ContentHeader>
                <HeaderBar>
                    <TextContainer>
                        <H3 margin='0 0 var(--spacing-2) 0'>Kiosk</H3>
                        <MintContainer>
                            <HeroImage/>
                            <Text margin='0'> Minted: <Number weight='700' color='var(--text-body-1)'>{ event.codes - event.codesAvailable }/{ event.codes }</Number></Text>
                                
                        </MintContainer>
                    </TextContainer>
                    <ButtonContainer>
                        <RoundedButton onClick={ f => window.open( eventLink, '_blank' ) }>
                            <PoapIcon size='16' icon='QRCodeIcon' color='var(--primary-500)' margin='0 3px 0 0' />
                            Open kiosk
                        </RoundedButton>
                        <RoundedButton onClick={ safelyDeleteEvent } >
                            <PoapIcon size='16' icon='QRCodeIcon' color='var(--primary-500)' />
                        </RoundedButton>
                    </ButtonContainer>
                </HeaderBar>
            </ContentHeader>

            <div>
                { eventLink } | Kiosk expire date
                <br/>
                { adminLink }
            </div>
            <WarningBox>
                <ShareWarningIcon />
                <Text margin='-.75rem 0 0 .5rem' color='var(--neutral-500)'>Never send your kiosk links to anyone!</Text>
            </WarningBox>
        </MethodContent>
        
    </ MethodContainer>


}