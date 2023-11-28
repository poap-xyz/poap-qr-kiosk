const { log } = require("./helpers");
const { db } = require("./firebase");

let cached_api_health = false;
let cached_api_health_timestamp = 0;
const cached_api_health_duration_ms = 10_000;
const health_check = async () => {
	// Function dependencies
	const { live_access_token, call_poap_endpoint } = require("./poap_api");

	const status = {
		healthy: false,
		poap_api: false,
		poap_api_auth: false,
	};

	try {
		// Check if we have an access token to the POAP API
		const has_token = await live_access_token().catch((e) => {
			log(e);
			return false;
		});

		// if the cached api health is stale, check the api health
		const api_health_cache_stale =
			Date.now() - cached_api_health_timestamp > cached_api_health_duration_ms;
		if (api_health_cache_stale) {
			// Check the self-reported health of the POAP api
			cached_api_health = await call_poap_endpoint(`/health-check`).catch((e) => {
				log(e);
				return false;
			});
		}

		// Update status object to reflect new data
		status.healthy = !!(has_token && cached_api_health);
		status.poap_api = !!cached_api_health;
		status.poap_api_auth = !!has_token;

		return status;
	} catch (e) {
		return {
			...status,
			error: e.message,
		};
	}
};

exports.health_check = health_check;

exports.public_health_check = async (req, res) => {
	try {
		const status = await health_check();
		return res.json(status);
	} catch (e) {
		return res.json({ error: e.message });
	}
};

exports.clean_up_expired_items = async () => {
	const maxInProgress = 500;
	const day_in_ms = 1000 * 60 * 60 * 24;
	const time_to_keep_after_expiry = day_in_ms * 90;

	// Function dependencies
	const { throttle_and_retry } = require("./helpers");

	try {
		/* ///////////////////////////////
		// Grab expired events */
		const grace_period_events = Date.now() - time_to_keep_after_expiry;
		const { docs: expired_events } = await db
			.collection("events")
			.where("expires", "<", grace_period_events)
			.get();

		console.log(`${expired_events.length} expired events`);

		// Generate action queue
		const event_deletion_queue = expired_events.map((doc) => () => doc.ref.delete());

		// Throttled delete
		await throttle_and_retry(event_deletion_queue, maxInProgress, `event deletion`, 5, 5);

		/* ///////////////////////////////
		// Delete orphaned data */
		const grace_period_orphans = Date.now() - time_to_keep_after_expiry * 2;
		const { docs: expired_challenges } = await db
			.collection("claim_challenges")
			.where("expires", "<", grace_period_orphans)
			.get();
		const { docs: expired_codes } = await db
			.collection("codes")
			.where("expires", "<", grace_period_orphans)
			.get();
		const { docs: expired_ci_claims } = await db
			.collection("static_drop_claims")
			.where("is_mock_claim", "==", true)
			.where("expires", "<", grace_period_orphans)
			.get();

		console.log(`${expired_challenges.length} expired challenges`);
		console.log(`${expired_codes.length} expired codes`);
		console.log(`${expired_ci_claims} expired CI claims`);

		// Generate action queue
		const orphan_deletion_queue = [
			...expired_challenges,
			...expired_codes,
			...expired_ci_claims,
		].map((doc) => () => doc.ref.delete());

		// Throttled delete
		await throttle_and_retry(orphan_deletion_queue, maxInProgress, `orphan deletion`, 5, 5);

		console.log(
			`Successfully deleted ${expired_events.length} events, ${expired_codes.length} codes, ${expired_challenges.length} challenges`,
		);
	} catch (e) {
		console.error("deleteExpiredCodes error ", e);
	}
};
