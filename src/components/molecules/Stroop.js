import styled from 'styled-components'
import Container from '../atoms/Container'
import { H1, H2, Text } from '../atoms/Text'
import Button from '../atoms/Button'
import Section from '../atoms/Section'

import { useState, useEffect, useRef } from 'react'
import { log } from '../../modules/helpers'
import useInterval from 'use-interval'

// Stroop assets
// const colors = [ 'red', 'green', 'blue', 'coral', 'darkblue', 'darkgreen', 'darkred', 'deeppink', 'lightgreen', 'lightblue', 'magenta', 'turquoise', 'purple', 'black', 'orange', 'grey' ]
const colors = [ 'red', 'green', 'blue', 'darkblue', 'darkgreen', 'darkred', 'lightgreen', 'lightblue', 'purple', 'black', 'orange', 'grey' ]
const pick_random_array_entry = array => array[ Math.floor( Math.random() * array.length ) ]
const random_color = except => pick_random_array_entry( colors.filter( color => color != except ) )

const Timer = ( { duration, onComplete } ) => {

	const [ timePassed, setTimePassed ] = useState( 0 )

	useInterval( f => {
		if( timePassed >= duration ) return onComplete()
		setTimePassed( timePassed + 1 )
	}, 1000 )

	return <Text>Timer: { duration - timePassed }</Text>
}

export default ( { duration_input, target_score_input, onWin, onLose, poap_url, ...props } ) => {

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
			.sort( ( a, b ) => a.sort - b.sort)
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

	function score_emoji() {

		if( score > target_score * 10 ) return '🦄'
		if( score > target_score * 5 ) return '🧙'
		if( score > target_score * 3 ) return '🤯'
		if( score > target_score * 2 ) return '😱'
		if( score > target_score * 1.5 ) return '🤩'
		if( score >= target_score ) return '😁'
		if( score > target_score / 2 ) return '🤨'
		return '😞'

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

	if( done ) return <Container>
		
		<H1 align='center'>You { score >= target_score ? 'won' : 'lost' }!</H1>
		<H2>Your score: { score } { score_emoji() }</H2>
		{ score >= target_score && <Button onClick={ claim_poap }>{ poap_url ? 'Claim your POAP' : 'Loading your POAP...' }</Button> }

	</Container>

	if( !started ) return <Container>
		
		<H1 align='center'>Play a game to prove you are human</H1>
		<H2 align='center'>Instructions: click the button with the right color</H2>
		<Text align='center'>Get the highest score you can in {duration} seconds</Text>
		<Button onClick={ f => setStarted( true ) }>Start game</Button>

	</Container>

	return	<Container>

		<H1 align='center'>Click the <span style={ { color: random_color( answer ) } }>{ answer }</span> button</H1>
		<H2>Score: { score } of { target_score } { score_emoji() }</H2>
		<Timer onComplete={ tally_score } duration={ duration } />

		<Section direction="row">
			
			{ options.map( option => <Button key={ Math.random() + option } color={ 'white' } background={ option } onClick={ f => submit_answer( option ) }>I am { option }</Button> ) }

		</Section>

	</Container>
}