// File upload test helper
import "cypress-file-upload";
import { get_claim_function_url } from "./e2e";
import { custom_base_url } from "../fixtures/mock-data";

// Timing helper
const elapsed = (start = 0) => (Date.now() - start) / 1000;

// Set language cookie default for each test
// see https://github.com/i18next/i18next-browser-languageDetector
beforeEach(() => {
	cy.setCookie("i18next", "en");
});

// Stub google analytics requests
beforeEach(() => {
	cy.intercept("https://unpkg.com/**/*", { middleware: true }, (req) => {
		// Disable request caching
		req.on("before:response", (res) => {
			// force all API responses to not be cached
			res.headers["cache-control"] = "no-store";
		});

		// Respond with a stubbed function
		req.reply(' () => console.log( "Stubbed Rive WASM" )');
	}).as("unpkg_stub");

	cy.intercept("https://cdn.jsdelivr.net/**/*", { middleware: true }, (req) => {
		// Disable request caching
		req.on("before:response", (res) => {
			// force all API responses to not be cached
			res.headers["cache-control"] = "no-store";
		});

		// Respond with a stubbed function
		req.reply(' () => console.log( "Stubbed Rive WASM CDN" )');
	}).as("jsdelivr");
});

// Stub rive WASM requests
beforeEach(() => {
	cy.intercept("https://www.googletagmanager.com/**/*", { middleware: true }, (req) => {
		// Disable request caching
		req.on("before:response", (res) => {
			// force all API responses to not be cached
			res.headers["cache-control"] = "no-store";
		});

		// Respond with a stubbed function
		req.reply(' () => console.log( "Stubbed Google Analytics" )');
	}).as("google_tag_stub");
});

/**
 * * Create a new kiosk with a number of codes
 * @param {'one'|'two'|'five'} code_amount - The number of codes to create, defaults to one
 * @param {'background'|'game'|'naive'} anti_farming_mode - The anti-farming mode to use, defaults to background
 * @returns {}
 */

Cypress.Commands.add("create_kiosk", (code_amount = "one", anti_farming_mode = "background") => {
	const admin = require("../fixtures/admin-user");
	const codes = require(
		`../fixtures/${code_amount}-correct-${code_amount == "one" ? "code" : "codes"}${
			Cypress.env("LOCAL") ? "" : "-ci"
		}.js`,
	);
	const uniquified_codes_as_string = codes.map((code) => `${code}-${Date.now()}`).join("\n");

	// Visit creation interface
	cy.visit("/create?debug=true");

	// Input the event data
	// cy.get( '#event-create-file' ).attachFile( Cypress.env( 'LOCAL' ) ? `two-correct-codes.txt` : `two-correct-codes-ci.txt` )
	cy.get("#event-create-file").selectFile(
		{
			contents: Cypress.Buffer.from(uniquified_codes_as_string),
			fileName: "mintlinks.csv",
			mimeType: "text/csv",
			lastModified: Date.now(),
		},
		{ force: true },
	);
	cy.get("#event-create-name").clear().type(admin.events[0].name);
	cy.get("#event-create-email").clear().type(admin.email);

	// Select no anti-farming
	if (anti_farming_mode == "background") {
		cy.get("#event-create-game-enabled").click({ force: true });
		cy.get("#event-create-game-enabled-0").click({ force: true });
	}

	// Game based anti-farming
	if (anti_farming_mode == "game") {
		// Select YES to anti-farming
		cy.get("#event-create-game-enabled").click({ force: true });
		cy.get("#event-create-game-enabled-1").click({ force: true });
		// Select anti-farming timing (10s)
		cy.get("#event-create-game-duration").click({ force: true });
		cy.get("#event-create-game-duration-1").click({ force: true });
		cy.log("Game time selected: 10s AKA 2 game turns");
	}

	// Naive anti-farming, uses all custom features
	if (anti_farming_mode == "naive") {
		// Enable developer mode by clicking background 20 times
		for (let i = 0; i < 20; i++) {
			cy.get("#event-create-layout-container").click({ force: true });
		}

		// Enable naive mode
		cy.get("#event-create-game-enabled").click({ force: true });
		cy.get("#event-create-game-enabled-2").click({ force: true });

		// Add custom css to the event
		cy.get("#event-create-css")
			.clear()
			.type(`body { opacity: 0.99; }`, { parseSpecialCharSequences: false });

		// Override the baseurl
		cy.get("#event-create-custom-baseurl").clear().type(custom_base_url);
	}

	// Naive anti-farming, uses all custom features
	if (anti_farming_mode == "custombase") {
		// Enable developer mode by clicking background 20 times
		for (let i = 0; i < 20; i++) {
			cy.get("#event-create-layout-container").click({ force: true });
		}

		// Override the baseurl
		cy.get("#event-create-custom-baseurl").clear().type(custom_base_url);
	}

	// Leadgen static printing mode
	if (anti_farming_mode == "leadgen") {
		// Enable developer mode by clicking background 20 times
		for (let i = 0; i < 20; i++) {
			cy.get("#event-create-layout-container").click({ force: true });
		}

		cy.get("#event-create-collect-emails").click({ force: true });
		cy.get("#event-create-collect-emails-1").click({ force: true });
		cy.get("#event-create-custom-baseurl").should("not.exist");
	}

	// Create event
	cy.get("#event-create-submit").click();

	// Verify that the new url is the admin interface
	cy.url().should("include", "/event/admin");
});

// Scan a QR and claim the challenge
Cypress.Commands.add("claim_challenge", (challenge_string, alias, start) => {
	start = start || Date.now();

	cy.log(`[ ${elapsed(start)}s ] Claiming event challenge: ${challenge_string}`);

	// Visit the challenge link
	cy.visit(`/`);
	cy.visit(`/claim/${challenge_string}`);

	// Check that backend redirected us to the claim page
	cy.url().should("include", "/#/claim");

	// Wait for code retreival
	cy.contains("POAP link");

	cy.log(`[ ${elapsed(start)}s ] Completed challenge ${alias}: ${challenge_string}`);
});

Cypress.Commands.add("get_challenge_from_qr_public_auth", (public_auth_string, alias, start) => {
	async function extract_challenge_from_url(response) {
		const { redirects } = response;
		cy.log(`Redirects: `, redirects);
		const [challenge_url] = redirects;
		const [base, challenge_redirect] = challenge_url.split("/#/claim/");
		const challenge = challenge_redirect.replace("307: ");
		cy.log(`[ ${elapsed(start)} ] Extracted challenge: ${challenge} from ${challenge_url}`);
		return challenge;
	}

	const request_options = {
		headers: {
			Host: new URL(Cypress.env("VITE_publicUrl")).host,
		},
		failOnStatusCode: false,
	};

	start = start || Date.now();

	cy.log(`[ ${elapsed(start)} ] Simulating QR scan for ${alias}`);

	cy.request({
		...request_options,
		url: `${get_claim_function_url()}/${public_auth_string}?CI=true`,
	})
		.then(extract_challenge_from_url)
		.then((challenge) => cy.wrap(challenge).as(alias));
});

// mint a POAP
Cypress.Commands.add("mint_poap", (address, alias, start) => {
	start = start || Date.now();

	cy.url().then((url) => {
		cy.log(`[ ${elapsed(start)}s ] Minting POAP for: ${alias} with link: ${url}`);

		// POAP minting screen
		cy.contains("Ready to mint");

		// Input claim ENS
		cy.get("#address-to-mint-to").clear();
		cy.get("#address-to-mint-to").type(address);

		// Successfully minting
		cy.get("#mint-poap-submit").click();

		// Check that backend redirected us to the claim page
		cy.contains("The minting process has started");

		cy.log(
			`[ ${elapsed(
				start,
			)}s ] Succesfully minted POAP for: ${alias} with: ${address} at: ${url}`,
		);
	});
});

// Scan a QR and mint the challenge
Cypress.Commands.add("mint_poap_from_challenge", (challenge_string, alias, start) => {
	start = start || Date.now();

	cy.log(`[ ${elapsed(start)}s ] Event challenge: ${challenge_string} for: ${alias}`);

	// Visit the challenge link
	cy.visit(`/`);
	cy.visit(`/claim/${challenge_string}`);

	// Check that backend redirected us to the claim page
	cy.url().should("include", "/#/mint");

	// Claim POAP with ENS
	cy.mint_poap("poap.eth", alias, start);
});
