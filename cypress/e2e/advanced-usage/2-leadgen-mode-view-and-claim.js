const random_code = `testing-${Math.random()}`;
const random_email = `${Math.random()}@email.com`;
const invalid_code = `a_code_is_never_longer_than_6_characters-${Math.random()}`;
const { get_claim_function_url, request_options } = require("../../support/e2e");

async function extract_challenge_from_url(response) {
	cy.log(`Url from which to extract challenge: `, response);
	const { redirects } = response;
	const [challenge_url] = redirects;
	cy.log(`Redirect: `, challenge_url);
	const [base, challenge_redirect] = challenge_url.split("/#/claim/");
	const challenge = challenge_redirect.replace("307: ");
	cy.log(`Challenge extracted: ${challenge}`);
	return challenge;
}

context("User can view and claim through static QR url", function () {
	it("Can create leadgen mode events", () => {
		cy.create_kiosk("two", "leadgen");

		// Save the event and admin links for further use
		cy.get("#admin-eventlink-public")
			.invoke("val")
			.as("event_1_publiclink")
			.then((f) => cy.log(this.event_1_publiclink));
		cy.get("#admin-eventlink-secret")
			.invoke("val")
			.as("event_1_secretlink")
			.then((f) => cy.log(this.event_1_secretlink));
	});

	it("Event displays qrs", function () {
		// Visit the public interface
		cy.visit(this.event_1_publiclink);

		// Accept disclaimer
		cy.get("#event-view-accept-disclaimer").click();

		// Save the first public auth link shown
		cy.get("svg[data-code]")
			.invoke("attr", "data-code")
			.as("event_1_public_auth_link")
			.then((f) => cy.log(`Event 1 public auth link: ${this.event_1_public_auth_link}`));
	});

	it("Event loads POAPs with leadgen base url", function () {
		// Visit the public link
		cy.request({
			...request_options,
			url: `${get_claim_function_url()}/${this.event_1_public_auth_link}`,
		})
			.as(`request`)
			.then(extract_challenge_from_url)
			.then((event_1_first_challenge) => {
				// Visit the challenge link
				cy.visit(`/claim/${event_1_first_challenge}`);

				// Save challenge link
				cy.url().as("event_1_first_challenge_url");

				// Check that backend redirected us to the claim page
				cy.url().should("include", "/#/claim");

				// Wait for code retreival
				cy.contains("POAP link");

				// Check if POAP link supplies one of the test codes
				cy.get("#loading_text")
					.invoke("text")
					.then((text) => {
						expect(text).to.contain("/#/static/claim/");
					});
			});
	});

	it("Can view test code", () => {
		// Visit code claim page
		cy.visit(`/static/claim/${random_code}`);

		// Page renders
		cy.contains(`Collect your POAP`);
	});

	it("Can claim test code", () => {
		// Visit code claim page
		cy.visit(`/static/claim/${random_code}`);

		// Fill in email
		cy.get("#static-print-qr-email-field").type(random_email);

		// Click checkbox
		cy.contains("I accept").click();

		// Claim POAP
		cy.get("a#static-print-qr-claim-button").click();
		cy.contains(`Collecting your POAP`);

		// Claim succeeded
		cy.contains(`successfully collected`);
	});
});

context("User can view and claim through static QR url", () => {
	it("Fails when trying to claim the same code twice", () => {
		// Visit code claim page
		cy.visit(`/static/claim/${random_code}`);

		// Should say the code expired
		cy.contains(`already used`);
	});

	it("Fails when visiting malformed link", () => {
		// Visit code claim page
		cy.visit(`/static/claim/${invalid_code}`);

		// Should say the code expired
		cy.contains(`invalid link`);
	});
});
