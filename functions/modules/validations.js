// Taken from https://emailregex.com/
const email_regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i
exports.email_regex = email_regex
exports.sanitise_email = input => {

    // Sanitisation declarations
    const type = 'Email'

    // Taken from https://emailregex.com/
    const regex = email_regex

    // Check for validation match
    if( !input.match( regex ) ) throw new Error( `${ type } input is not a valid` )

    // Return normalised string version of input
    return `${ input.toLowerCase().trim() }`

}

const eth_address_or_ens_regex = /(0x[a-f0-9]{40})|(.*\.eth)/i
exports.eth_address_or_ens_regex = eth_address_or_ens_regex
exports.sanitise_address_or_ens = input => {

    // Sanitisation declarations
    const type = 'Address/ENS'

    const regex = eth_address_or_ens_regex

    // Check for validation match
    if( !`${ input }`.match( regex ) ) throw new Error( `${ type } input ${ input } is not a valid` )

    // Return normalised string version of input
    return `${ input?.toLowerCase().trim() }`

}

exports.sanitise_poap_drop_id = input => {

    // Sanitisation declarations
    const type = 'Drop ID'
    const regex = /[0-9]*/

    // Check for validation match
    if( !input.match( regex ) ) throw new Error( `${ type } input is not a valid` )

    // Return normalised string version of input
    return `${ input.toLowerCase().trim() }`

}

exports.sanitise_poap_drop_secret_code = input => {

    // Sanitisation declarations
    const type = 'Secret code'
    const regex = /[0-9]{6}/

    // Check for validation match
    if( !input.match( regex ) ) throw new Error( `${ type } input is not a valid` )

    // Return normalised string version of input
    return `${ input.toLowerCase().trim() }`

}

exports.sanitise_string = string => `${ string }`.toLocaleLowerCase().trim()

exports.ens_address_regex = /(.*\.eth)/i