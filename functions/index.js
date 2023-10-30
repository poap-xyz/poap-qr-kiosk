// // V1 Dependencies
// const functions = require( "firebase-functions" )

// // V1 Runtime config
// const generousRuntime = {
//     timeoutSeconds: 540,
//     memory: '4GB'
// }

// const { log, dev } = require( './modules/helpers' )
// log( `⚠️ Verbose mode on, ${ dev ? '⚙️ dev mode on' : '🚀 production mode on' }` )

// // Runtime config
// const { v1_oncall, v2_oncall } = require( './runtime/on_call_runtimes' )
// const { v1_onrequest, v2_onrequest } = require( './runtime/on_request_runtimes' )

// // ///////////////////////////////
// // Code status managers
// // ///////////////////////////////

// const { refreshScannedCodesStatuses, refresh_unknown_and_unscanned_codes, getEventDataFromCode, check_code_status } = require( './modules/codes' )

// // Get event data of a code
// exports.getEventDataFromCode = v1_oncall( getEventDataFromCode )

// // Get all data of a code
// exports.check_code_status = v1_oncall( check_code_status )

// // Refresh all codes ( trigger from frontend on page mount of EventView )
// exports.requestManualCodeRefresh = v1_oncall( [ 'high_memory', 'long_timeout'  ], refresh_unknown_and_unscanned_codes )

// // Allow frontend to trigger updates for scanned codes, ( triggers on a periodic interval from EventView ), is lighter than requestManualCodeRefresh as it checks only scanned and claimed == true codes
// exports.refreshScannedCodesStatuses = v1_oncall( [ 'high_memory', 'long_timeout' ], refreshScannedCodesStatuses )

// // Directly mint a code to an address
// const { mint_code_to_address } = require( './modules/minting' )
// exports.mint_code_to_address = v2_oncall( [ 'high_memory', 'long_timeout' ], mint_code_to_address )

// // Let admins recalculate available codes
// const { recalculate_available_codes_admin } = require( './modules/codes' )
// exports.recalculate_available_codes = v2_oncall( recalculate_available_codes_admin )

// // ///////////////////////////////
// // Event data
// // ///////////////////////////////

// const { registerEvent, deleteEvent, getUniqueOrganiserEmails } = require( './modules/events' )
// exports.registerEvent = v1_oncall( [ 'high_memory', 'long_timeout' ], registerEvent )
// exports.deleteEvent = v1_oncall( deleteEvent )

// // Email export to update event organisers
// exports.getUniqueOrganiserEmails = v1_oncall( getUniqueOrganiserEmails )

// // ///////////////////////////////
// // QR Middleware API
// // ///////////////////////////////
// const claimMiddleware = require( './modules/claim' )
// exports.claimMiddleware = v2_onrequest( [ 'max_concurrency', 'keep_warm', 'memory' ], claimMiddleware )

// /* ///////////////////////////////
// // Kiosk generator middleware API
// // /////////////////////////////*/
// const generate_kiosk = require( './modules/kiosk_generator' )
// exports.generate_kiosk = v1_onrequest( generate_kiosk )

// // ///////////////////////////////
// // Housekeeping
// // ///////////////////////////////

// const { updateEventAvailableCodes } = require( './modules/codes' )
// const { delete_data_of_deleted_event, updatePublicEventData } = require( './modules/events' )
// const { clean_up_expired_items } = require( './modules/health' )

// // Delete items where parents were deleted
// exports.clean_up_expired_items = functions.runWith( generousRuntime ).pubsub.schedule( 'every 24 hours' ).onRun( clean_up_expired_items )
// exports.delete_data_of_deleted_event = functions.firestore.document( `events/{eventId}` ).onDelete( delete_data_of_deleted_event )

// // Update items where parents were updated
// exports.updatePublicEventData = functions.firestore.document( `events/{eventId}` ).onWrite( updatePublicEventData )
// exports.updateEventAvailableCodes = functions.firestore.document( `codes/{codeId}` ).onUpdate( updateEventAvailableCodes )


// /* ///////////////////////////////
// // Security
// // /////////////////////////////*/
// const { validateCallerDevice, validateCallerCaptcha } = require( './modules/security' )
// exports.validateCallerDevice = v2_oncall( [ 'high_memory', 'long_timeout', 'keep_warm' ], validateCallerDevice )
// exports.validateCallerCaptcha = v1_oncall( validateCallerCaptcha )

// // Log kiosk opens
// const { log_kiosk_open } = require( './modules/security' )
// exports.log_kiosk_open = v2_oncall( log_kiosk_open )

// /* ///////////////////////////////
// // Code claiming
// // /////////////////////////////*/
// const { get_code_by_challenge } = require( './modules/codes' )
// exports.get_code_by_challenge = v1_oncall( get_code_by_challenge )

// /* ///////////////////////////////
// // Health check
// // /////////////////////////////*/
// const { health_check, public_health_check } = require( './modules/health' )
// exports.health_check = v1_oncall( health_check )
// exports.ping = v2_oncall( [ 'max_concurrency' ],ping => 'pong' )

// /* ///////////////////////////////
// // Static QR system
// // /////////////////////////////*/
// const { claim_code_by_email } = require( './modules/codes' )
// const { export_emails_of_static_drop, create_static_drop, update_public_static_drop_data, delete_emails_of_static_drop } = require( './modules/static_qr_drop' )
// exports.export_emails_of_static_drop = v1_oncall( export_emails_of_static_drop )
// exports.delete_emails_of_static_drop = v1_oncall( delete_emails_of_static_drop )
// exports.claim_code_by_email = v1_oncall( claim_code_by_email )
// exports.create_static_drop = v1_oncall( create_static_drop )
// exports.update_public_static_drop_data = functions.firestore.document( `static_drop_private/{drop_id}` ).onWrite( update_public_static_drop_data )

// // Public health check
// exports.public_health_check = v1_onrequest( public_health_check )