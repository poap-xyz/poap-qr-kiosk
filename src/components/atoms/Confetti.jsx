import React, { useEffect, useCallback, useRef } from 'react'
import Particles from 'react-particles'
import { loadFull } from "tsparticles"

import desktopParticles from '../../assets/json/poap-particles.json'
import mobileParticles from '../../assets/json/poap-particles-mobile.json'

const Confetti = ( { autoPlay = true, duration = Infinity, toggle, mobile } ) => {

    const particleOptions = mobile ? mobileParticles : desktopParticles
    const containerRef = useRef()
    const particlesInit = useCallback( async ( main ) => {
        await loadFull( main )
    }, [] )

    // Add autoPlay to the options
    useEffect( () => {
        if( containerRef && containerRef.current ) {

            // Fuse autoplay option into current container options
            containerRef.current.options.autoPlay = autoPlay
        }
    } )

    const handleResumeEmitters = () => {

        // Start the container if autPlay is set to false
        if( containerRef.current?._paused === true ) {
            containerRef.current.play()
        }

        // Start the emitters only
        if( containerRef.current ) {
            const emittersPlugin = containerRef.current.plugins.get( "emitters" )
            emittersPlugin.array.forEach( ( emitter ) => {
                emitter.play()
            } )
        }
    }

    const handlePauseEmitters = () => {

        // To freeze the container and it's content
        // if( containerRef.current ) {
        //     containerRef.current.pause()
        // }

        // To stop the emitters only
        if( containerRef.current ) {
            const emittersPlugin = containerRef.current.plugins.get( "emitters" )
            emittersPlugin.array.forEach( ( emitter ) => {
                emitter.pause()
            } )
        }
    }

    // Toggle feature
    useEffect( () => {
        if( toggle ) {
            handlePauseEmitters()
        } else {
            handleResumeEmitters()
        }
    }, [ toggle ] )

    // Duration configuration
    useEffect( () => {
        if( !isNaN( duration ) && duration !== Infinity ) {
            const timer = setTimeout( () => {
                handlePauseEmitters()
            }, duration )
            return () => clearTimeout( timer )
        }
    }, [ duration ] )



    return <Particles
        id="tsparticles"
        init={ particlesInit }
        container={ containerRef }
        options={ { ...particleOptions } }
    />

}

export default Confetti