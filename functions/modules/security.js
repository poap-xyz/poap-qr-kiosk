const { log } = require("./helpers");

/* ///////////////////////////////
// Appcheck validation */
exports.validateCallerDevice = (request) => {
	if (request.app == undefined) return false;

	return true;
};
exports.throw_on_failed_app_check = (context) => {
	if (context.app == undefined) throw new Error(`Failed appcheck`);
};

/* ///////////////////////////////
// reCaptcha v2 validation */
exports.validateCallerCaptcha = async (captcha_response, context) => {
	// Function dependencies
	const fetch = require("isomorphic-fetch");
	const { db } = require("./firebase");
	const { RECAPTCHA_SECRET } = process.env;

	try {
		/* ///////////////////////////////
		// Validate user resonse with recaptcha */
		const recaptcha_endpoint = `https://www.google.com/recaptcha/api/siteverify`;
		const options = {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: `secret=${RECAPTCHA_SECRET}&response=${captcha_response}`,
		};
		log("Checking captcha with", options);
		const { success, ...response } = await fetch(recaptcha_endpoint, options).then((res) =>
			res.json(),
		);

		// On fail, return false
		if (!success) throw new Error(`Captcha errors: ${response["error-codes"]?.join(", ")}`);

		// On success, cache response so we have longer that the captcha 2 mins validity
		const five_mins_in_ms = 1000 * 60 * 5;
		await db
			.collection(`recaptcha`)
			.doc(captcha_response)
			.set({
				valid: true,
				updated: Date.now(),
				updated_human: new Date().toString(),
				expires: Date.now() + five_mins_in_ms,
			});
		return true;
	} catch (e) {
		log("Captach validation error: ", e);
		return false;
	}
};

/**
 * * Function that generates geolocation metadata from a request object
 * @param {Object} request - a express.js compatible request object as provided by firebase functions
 * @returns {Object} request_metadata - an object containing geolocation metadata
 * @returns {String} request_metadata.request_ip - the ip address of the caller
 * @returns {String} request_metadata.city - the city of the caller
 * @returns {String} request_metadata.country - the country of the caller
 */
const generate_metadata_from_request = (request) => {
	const { get_ip_from_request } = require("./firebase");
	const request_ip = get_ip_from_request(request);

	// Create metadata object
	let request_metadata = {
		request_ip,
		updated: Date.now(),
		updated_human: new Date().toString(),
	};

	// If there is no request ip, return an empry object because we cannot proceed
	if (!request_ip) return {};

	// Get location from IP
	const geoip = require("geoip-lite");
	const { city = "unknown", country = "unknown" } = geoip.lookup(request_ip) || {};
	request_metadata = { ...request_metadata, city, country };

	return request_metadata;
};
exports.generate_metadata_from_request = generate_metadata_from_request;

/* ///////////////////////////////
// Log opens of the kiosk */
exports.log_kiosk_open = async (request) => {
	// Function dependencies
	const { db, increment } = require("./firebase");

	try {
		// Get the kiosk id from the request
		const { data: kiosk_id } = request;
		log(`Logging kiosk open for ${kiosk_id}`);

		// Get ip address of caller
		const { request_ip = "unknown", ...metadata } = generate_metadata_from_request(request);
		log(`Request metadata: `, request_ip, metadata);

		// Log this scan for farmer analysis
		await db
			.collection("kiosk_opens")
			.doc(kiosk_id)
			.set(
				{
					[request_ip]: {
						opens: increment(1),
						...metadata,
					},
				},
				{ merge: true },
			);
	} catch (e) {
		log("Error logging kiosk open: ", e);
	}
};
