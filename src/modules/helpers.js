// ///////////////////////////////
// Development helpers
// ///////////////////////////////
export const dev = process.env.NODE_ENV === 'development' || ( typeof location !== 'undefined' && location.href.includes( 'debug=true' ) )

export const log = ( ...messages ) => {
	if( dev ) console.log( ...messages )
}

// ///////////////////////////////
// Date helpers
// ///////////////////////////////
export const dateOnXDaysFromNow = days => {

	const daysInMs = days * 24 * 60 * 60 * 1000
	return new Date( Date.now() + daysInMs ).toISOString().slice(0, 10)

}

export const monthNameToNumber = monthName => {
	const months = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ]
	const monthNumber = months.findIndex( month => month.includes( monthName.toLowerCase() ) ) + 1
	return `${monthNumber}`.length == 1 ? `0${monthNumber}` : monthNumber
}