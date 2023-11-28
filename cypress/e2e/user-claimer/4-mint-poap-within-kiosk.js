const { eth_address, ens_address } = require("../../fixtures/mock-data");

context("Minting POAPs within Kiosk", () => {
	it("Rejects invalid claim codes", () => {
		cy.visit(`/mint/not-a-valid-claim-code`);
		cy.get("#address-to-mint-to").type(eth_address);
		cy.contains("Collect your POAP").click();
		// Show error Toast
		cy.contains("Failed");

		// Show failed landing
		cy.contains("Oh no! Something went wrong.");
	});

	it("Auto-mint fails with an invalid claim code", () => {
		cy.visit(`/mint/not-a-valid-claim-code?user_address=${eth_address}`);

		// Show error Toast
		cy.contains("Failed");

		// Show failed landing
		cy.contains("Oh no! Something went wrong.");
	});

	it("Mints valid test claim codes", () => {
		cy.visit(`/mint/testing-123`);
		cy.get("#address-to-mint-to").type(ens_address);
		cy.contains("Collect your POAP").click();
		cy.contains("The minting process has started");
	});

	it("Auto-mints when the address is passed through the query string", () => {
		cy.visit(`/mint/testing-123?user_address=${eth_address}`);
		cy.contains("The minting process has started");
	});
});
