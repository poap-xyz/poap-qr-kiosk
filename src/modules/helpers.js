// ///////////////////////////////
// Development helpers
// ///////////////////////////////
export const dev = import.meta.env.NODE_ENV === 'development' ||  typeof location !== 'undefined' && ( location.href.includes( 'debug=true' ) || location.href.includes( 'localhost' ) ) 

export const log = ( ...messages ) => {

    // If we are in cypress, strinfify objects
    if( window.Cypress ) messages = messages.map( message => typeof message === 'object' ? JSON.stringify( message, null, 2 ) : message )

    if( dev ) console.log( ...messages )
}

/* ///////////////////////////////
// Data helpers
// /////////////////////////////*/
export { v4 as uuidv4 } from 'uuid'

// ///////////////////////////////
// Date helpers
// ///////////////////////////////

/**
 * Formats a timestamp into a custom date format string in the specified locale.
 *
 * @param {number} timestamp - The timestamp to format.
 * @param {string} locale - The locale for formatting the date (e.g., 'en-US', 'nl-NL').
 * @returns {string} The formatted date string.
 */
export function formatDate( timestamp, locale ) {
    const date = new Date( timestamp )
    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    }
  
    return date.toLocaleDateString( locale, options )
}
  


export const dateOnXDaysFromNow = days => {

    const daysInMs = days * 24 * 60 * 60 * 1000
    return new Date( Date.now() + daysInMs ).toISOString().slice( 0, 10 )

}

export const monthNameToNumber = monthName => {
    const months = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ]
    const monthNumber = months.findIndex( month => month.includes( monthName.toLowerCase() ) ) + 1
    return `${ monthNumber }`.length == 1 ? `0${ monthNumber }` : monthNumber
}

// ///////////////////////////////
// Visual
// ///////////////////////////////

export const wait = ( time, error=false ) => new Promise( ( res, rej ) => setTimeout( error ? rej : res, time ) )

/* ///////////////////////////////
// Security helpers
// /////////////////////////////*/
export const remove_script_tags = ( string='' ) => string.replace( /<.*script.*>/ig, '' )