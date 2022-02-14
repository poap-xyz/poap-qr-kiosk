const functions = require( 'firebase-functions' )
const { environment } = functions.config()
const dev = !!process.env.development || environment?.development

// Dev Logger
const log = ( ...comments ) => {
	if( dev ) console.log( ...comments )
}

// Object properties checker
const require_properties = ( obj={}, required_properties=[] ) => {

	const keys = Object.keys( obj )
	const contains_all_required = required_properties.every( key => keys.includes( key ) )
	log( `Checking keys `, keys, `against required: `, contains_all_required, ' for object ', obj )
	if( !contains_all_required ) throw new Error( `Missing required properties in request` )

}

// Object unexpected input checker
const allow_only_these_properties = ( obj, allowed_properties ) => {

	const keys = Object.keys( obj )
	const unknownProperties = keys.filter( key => !allowed_properties.includes( key ) )
	log( `Checking keys `, keys, `for non-allowed, found: `, unknownProperties )
	if( unknownProperties.length ) throw new Error( `Unknown properties given: ${ unknownProperties.join( ', ' ) }` )

}

module.exports = {
	dev,
	log,
	require_properties,
	allow_only_these_properties
}