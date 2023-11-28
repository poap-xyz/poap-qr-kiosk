// Firebase interactors
const { FieldValue } = require("firebase-admin/firestore");
const { dev, log } = require("./helpers");

// Cached app instalce
let cached_app = undefined;
const get_app = () => {
	if (cached_app) return cached_app;
	const { initializeApp } = require("firebase-admin/app");
	cached_app = initializeApp();
	return cached_app;
};

// Cached firestore instance
let cached_db = undefined;
const get_db = () => {
	if (cached_db) return cached_db;
	const { getFirestore } = require("firebase-admin/firestore");
	cached_db = getFirestore(get_app());
	return cached_db;
};

// Get cached instances
const app = get_app();
const db = get_db();

const dataFromSnap = (snapOfDocOrDocs, withDocId = true) => {
	// If these are multiple docs
	if (snapOfDocOrDocs.docs)
		return snapOfDocOrDocs.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

	// If this is a single document
	return { ...snapOfDocOrDocs.data(), ...(withDocId && { uid: snapOfDocOrDocs.id }) };
};

// Firestore helpers
const is_valid_firestore_value = (value) => value !== undefined && value !== null && value !== "";

/**
 * Get ip data from callable function context or request, both the gen1 and gen2 concepts are supported
 * @param {Object} request - Request or context object as provided by firebase callable functions
 * @returns {(String|undefined)}  return the ip address of the caller, or undefined
 */
const get_ip_from_request = (firebase_request) => {
	try {
		// If we are in a dev environment, mock the ip
		if (dev) {
			log(`🤡 mocking ip output in dev`);
			return `mock.mock.mock.mock`;
		}

		// Get the express request
		const { rawRequest: req } = firebase_request;

		// If no rawRequest is available, log out firebase request properties
		if (!req) {
			log(`No rawRequest found, logging request properties: `, Object.keys(firebase_request));
			return undefined;
		}

		// Get relevant request subsections
		let { ip: request_ip, ips } = req;

		// Try to get ip from headers
		let ip =
			req.get("fastly-client-ip") || req.get("x-forwarded-for") || request_ip || ips?.[0];

		// If ip is an array, take the first one
		if (Array.isArray(ip)) [ip] = ip;

		// If headers contained a comma separated ip list, take the first one
		if (`${ip}`.includes(",")) ip = ip?.split(",")?.[0]?.trim();

		// Return the ip
		return ip;
	} catch (e) {
		log(`Error getting ip from request: `, e);
		return undefined;
	}
};

module.exports = {
	db: db,
	app: app,
	dataFromSnap: dataFromSnap,
	increment: FieldValue.increment,
	arrayUnion: FieldValue.arrayUnion,
	deleteField: FieldValue.delete,
	get_ip_from_request,
	is_valid_firestore_value,
};
