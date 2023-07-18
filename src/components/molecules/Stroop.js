import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useInterval from 'use-interval'

import { log } from '../../modules/helpers'

import { CardContainer, Container, Divider, Button, Text, H1, H2,  HeroIcon } from '@poap/poap-components'

import { Grid } from '../atoms/Grid'
import WebpImager from '../atoms/WebpImager'
import { StroopButton } from '../atoms/StroopButton'

import ViewWrapper from '../molecules/ViewWrapper'

import { ReactComponent as DiamondLogo } from '../../assets/illustrations/valuable-diamond.svg'
import { ReactComponent as PlayfulIcon } from '../../assets/illustrations/playful.svg'
import { ReactComponent as WelldoneIcon } from '../../assets/illustrations/well_done.svg'



// Stroop assets
const colors = [ 'orange', 'pink', 'yellow', 'blue', 'green', 'purple', 'red', 'grey' ]
const pick_random_array_entry = array => array[ Math.floor( Math.random() * array.length ) ]
const random_color = except => pick_random_array_entry( colors.filter( color => color != except ) )

const Timer = ( { duration, onComplete, ...props } ) => {

    const [ timePassed, setTimePassed ] = useState( 0 )
    const { t } = useTranslation( )

    useInterval( f => {
        if( timePassed >= duration ) return onComplete()
        setTimePassed( timePassed + 1 )
    }, 1000 )

    return <Text { ...props }>{ t( 'EventView.stroop.timer' ) } { duration - timePassed }</Text>
}

const getColorVariables = ( colorName ) => {
    const colorVariables = {
        orange: 'var(--secondary-1)',
        pink: 'var(--error-200)',
        yellow: 'var(--secondary-3)',
        blue: 'var(--secondary-4)',
        green: 'var(--secondary-5)',
        purple: 'var(--primary-300)',
        red: 'var(--error-300)',
        grey: 'var(--gray-300)'
    }
    return colorVariables[colorName] || ''
}

export default ( { duration_input, target_score_input, onWin, onLose, poap_url, ...props } ) => {

    // i18next hook
    const { t } = useTranslation()

    const [ started, setStarted ] = useState( false )
    const [ answer, setAnswer ] = useState( random_color() )
    const [ options, setOptions ] = useState( [] )
    const [ score, setScore ] = useState( 0 )
    const [ attempts, setAttempts ] = useState( 0 )
    const [ done, setDone ] = useState( false )

    // Game state management
    // Note: duration & target_score change as challenge changes. If it does from something to undefined, that is because the challenge was completed and nothing should change
    const [ duration, set_duration ] = useState( duration_input )
    const [ target_score, set_target_score ] = useState( target_score_input )
    
    useEffect( (  ) => {

        // Logging
        log( `Input duration input/state ${ duration_input }/${ duration }` )
        log( `Input target_score input/state ${ target_score_input }/${ target_score }` )

        // If the state was empty, set it to the new value
        if( !duration && duration_input ) set_duration( duration_input )
        if( !target_score && target_score_input ) set_target_score( target_score_input )

        // If the state was full, and this is a change, set the change
        if( target_score_input && target_score != target_score_input ) set_target_score( target_score_input )
        if( duration_input && duration != duration_input ) set_duration( duration_input )

    }, [ target_score_input, duration_input ] )

    // Debugging info
    useEffect( (  ) => log( `Configuring game of ${ duration } seconds, target_score: ${ target_score }. onWin ${ !!onWin }, onLose ${ !!onLose }` ), [ duration, target_score ] )
    useEffect( (  ) => log( `POAP code `, poap_url ), [ poap_url ] )

    // Generate options on the giving of an answer
    useEffect( () => {

        // Generate some random options
        const random_colors = [
            random_color( answer ),
            random_color( answer ),
            // random_color( answer ),
            // random_color( answer )
        ]
        log( `Random colors: `, random_colors, ' answer: ', answer )

        // Shuffle the real answer in with the options
        const shuffled_answers = [ ...random_colors, answer ]
            .map( value => ( { value, sort: Math.random() } ) )
            .sort( ( a, b ) => a.sort - b.sort )
            .map( ( { value } ) => value )

        // Set options to state
        log( `Shuffled options: `, shuffled_answers )
        setOptions( shuffled_answers )

    }, [ attempts ] )

    /* ///////////////////////////////
	// Component functions
	// /////////////////////////////*/
    function submit_answer( option ) {

        // increase score for right answers
        if( option == answer ) setScore( score + 1 )
        else setScore( score - 1 )

        // Increment and update interface
        setAttempts( attempts + 1 )
        setAnswer( random_color() )

    }

    function tally_score() {

        log( 'Game complete! Score:', score, ' target: ', target_score )
        setDone( true )
        if( score >= target_score && onWin ) return onWin( score, Date.now() )
        if( onLose ) return onLose( score, Date.now() )

    }

    function claim_poap() {
        if( poap_url ) window.location.replace( poap_url )
    }

    if( done ) return <ViewWrapper center show_bookmark>
        <Container>
            <CardContainer width='400px' margin='0 auto'>

                { /* Lost and Won states */ }
                { score < target_score ? 
                    <> 
                        <PlayfulIcon />
                        <H1 align='center' size='var(--fs-lg)' margin='var(--spacing-5) 0 var(--spacing-1) 0'>{ t( 'EventView.stroop.lost' ) }</H1>
                        <Divider outline margin='0 0 var(--spacing-6) 0' />
                        <Text align='center' margin='0 0 var(--spacing-5) 0' whiteSpace>{ t( 'EventView.stroop.failMessage', { target_score: target_score } ) }</Text>
                        <Text align='center'>{ t( 'EventView.stroop.score' ) } <br/> { score }</Text>
                        <Button onClick>{ t( 'EventView.stroop.TryAgain' )  }</Button> 
                    </> 
                    : 
                    <>
                        <WelldoneIcon />
                        <H1 align='center' size='var(--fs-lg)' margin='var(--spacing-5) 0 var(--spacing-1) 0'> { t( 'EventView.stroop.won' ) }</H1>
                        <Divider outline margin='0 0 var(--spacing-6) 0' />
                        <Text align='center' margin='0 0 var(--spacing-6) 0'>{ t( 'EventView.stroop.score' ) } <br/> { score }</Text>
                        { score >= target_score && <Button onClick={ claim_poap } leftIcon={ <HeroIcon icon={ poap_url ? 'sparkles' : ''  } /> }>{ poap_url ? t( 'EventView.stroop.claimPoap' ) : t( 'EventView.stroop.loadPoap' ) }</Button> }
                    </> }
                
            </CardContainer>
        </Container>
    </ViewWrapper>

    if( !started ) return <ViewWrapper center show_bookmark>
        <Container>
            <CardContainer width='400px' margin='var(--spacing-8) auto 0 auto'>
                <DiamondLogo />
                <Text size='var(--fs-lg)' weight={ 700 } color='var(--primary-700)'  align='center' margin='var(--spacing-5) 0 var(--spacing-2) 0' >{ t( 'EventView.stroop.game.title' ) }</Text>
                <Divider outline />
                <Text color='var(--primary-700)' margin='1rem 0' align='center' whiteSpace>{ t( 'EventView.stroop.game.subtitle' ) }</Text>

                <WebpImager imageUrl='/assets/decorations/Stroop-example' alt='test' />

                <Text align='center'>{ t( 'EventView.stroop.game.description', { duration: duration } ) }</Text>

                <Button width='100%' onClick={ f => setStarted( true ) }>{ t( 'EventView.stroop.game.btn' ) }</Button>

            </CardContainer>
        </Container>
    </ViewWrapper>

    return  <ViewWrapper center show_bookmark hide_background>

        <Container flex='1'>
            <Grid width='400px' padding='var(--spacing-4) var(--spacing-1)'>
                <H1 align="center" size='var(--fs-3xl)' lineHeight='--lh-xl' weight={ 700 } margin='0 0 var(--spacing-6) 0'>{ t( 'EventView.stroop.playing.preTitle' ) } <br/> <span style={ { color: getColorVariables( random_color( answer ) ) } }>{ answer }</span> <br/>{ t( 'EventView.stroop.playing.postTitle' ) }</H1>
                <H2 align='center' color='var(--primary-600)' margin='0 0 var(--spacing-6) 0'>{ t( 'EventView.stroop.playing.subtitle', { score: score, target_score: target_score } ) }</H2>
                { score >= target_score ? <Text align='center' size='var(--fs-2xs)' color='#797292'>Well done, keep going to see how far you can go!</Text> : <div style={ { height: '40px' } }>    </div> }
                <Timer align='center' margin='0 0 var(--spacing-8) 0' onComplete={ tally_score } duration={ duration } />
                
                { options.map( option => <StroopButton key={ Math.random() + option } color="white" background={ getColorVariables( option ) } width='100%' margin='0 0 var(--spacing-7)' onClick={ f => submit_answer( option ) }>I am { option }</StroopButton> ) }

            </Grid>
        </Container>
    </ViewWrapper>

}