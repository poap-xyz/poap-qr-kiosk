import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Modules
import { log, remove_script_tags } from "../../modules/helpers";
import { claim_code_by_email } from "../../modules/firebase";

// Hooks
import { useCodeMetadata } from "../../hooks/printed_qrs";

// Components
import Loading from "../molecules/Loading";
import ViewWrapper from "../molecules/ViewWrapper";
import Section from "../atoms/Section";
import Style from "../atoms/Style";
import { Button, Input, H1, H2, Text, Container } from "@poap/poap-components";

export default function StaticClaim() {
	// i18next hook
	const { t } = useTranslation();

	const [email_or_0x_address, set_email_or_0x_address] = useState("");
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [user_claimed, set_user_claimed] = useState(false);
	const { claim_code } = useParams();
	const code_meta = useCodeMetadata(claim_code);
	const [loading, setLoading] = useState();
	const [emailError, setEmailError] = useState();

	async function claim_poap() {
		log(`Starting claim for claimcode ${claim_code} for ${email_or_0x_address}`);
		try {
			// Validate inputs
			if (code_meta?.drop_meta?.optin_text && !termsAccepted)
				throw new Error(`${t("staticClaim.validations.accept_terms")}`);
			if (
				!email_or_0x_address?.includes("@") &&
				!email_or_0x_address.match(/0x[0-9-a-z]{40}/gi)
			)
				throw new Error(`${t("staticClaim.validations.valid_email")}`);
			if (!claim_code) throw new Error(`${t("staticClaim.validations.invalid_qr")}`);

			// Register claim with firebase
			setLoading(`${t("staticClaim.set_loading")}`);
			const { data: response } = await claim_code_by_email({
				claim_code,
				email_or_0x_address,
				is_static_drop: true,
			});
			const { error } = response;
			log(`Remote response `, response);

			if (error) throw new Error(`${error} (remote)`);
			set_user_claimed(true);
		} catch (e) {
			log(`POAP claim error:`, e);
			setEmailError(e.message);
		} finally {
			setLoading(false);
		}
	}

	/* ///////////////////////////////
    // Component rendering
    // /////////////////////////////*/
	const { drop_meta } = code_meta || {};

	// If loading, show spinner
	if (drop_meta == "loading" || loading)
		return <Loading generic_loading_styles={true} message={loading} />;

	// If no code meta is available yet, show spinner
	if (code_meta?.event === "loading")
		return (
			<Loading
				generic_loading_styles={true}
				message={t("staticClaim.validations.verifying_qr")}
			/>
		);

	// If code was already used, show error message
	if (code_meta?.claimed === true)
		return (
			<ViewWrapper
				center
				generic_loading_styles={true}
				id="static-print-qr-top-container-invalid"
			>
				<Section>
					<Container>
						<Text>{t("staticClaim.validations.used_qr")}</Text>
					</Container>
				</Section>
			</ViewWrapper>
		);

	// If no drop meta available, the user is trying to cheat or has a malformed link
	if (!code_meta?.event)
		return (
			<ViewWrapper
				center
				generic_loading_styles={true}
				id="static-print-qr-top-container-invalid"
			>
				<Section>
					<Container>
						<Text>{t("staticClaim.validations.invalid_link")}</Text>
					</Container>
				</Section>
			</ViewWrapper>
		);

	// If the user claimed the POAP, tell them to check their email
	if (user_claimed)
		return (
			<ViewWrapper
				center
				generic_loading_styles={true}
				id="static-print-qr-top-container-success"
			>
				<Section>
					<Container>
						<H1>{t("staticClaim.user_claimed.title")}</H1>
						<H2>
							{t("staticClaim.user_claimed.subtitle", { email: email_or_0x_address })}
						</H2>
						<Text>{t("staticClaim.user_claimed.description")}</Text>
					</Container>
				</Section>
			</ViewWrapper>
		);

	// Show claim interface
	return (
		<ViewWrapper center generic_loading_styles={true} id="static-print-qr-top-container">
			<Section>
				<Container>
					<H1 id="static-print-qr-h1">{t("staticClaim.title")}</H1>

					{drop_meta?.welcome_text && (
						<Text id="static-print-qr-welcome-text">
							{code_meta?.drop_meta?.welcome_text}
						</Text>
					)}

					<Input
						id="static-print-qr-email-field"
						label={t(
							`staticClaim.labels.email.${
								drop_meta?.allow_wallet_claim ? "label_with_wallet" : "label"
							}`,
						)}
						value={email_or_0x_address}
						onChange={({ target }) => set_email_or_0x_address(target.value)}
						error={emailError}
					/>

					{drop_meta?.optin_text && (
						<Text
							id="static-print-qr-optin-field"
							align="flex-start"
							onClick={(f) => setTermsAccepted(!termsAccepted)}
							direction="row"
						>
							<Input
								style={{ zoom: 1.3 }}
								margin="0 .5rem 0 0"
								width="50px"
								type="checkbox"
								onChange={({ target }) => setTermsAccepted(target.checked)}
								checked={termsAccepted}
							/>

							{/* This allows us to set terms & conditions texts through the firebase entry */}
							<span
								dangerouslySetInnerHTML={{
									__html: remove_script_tags(drop_meta?.optin_text),
								}}
							/>
						</Text>
					)}

					<Button
						id="static-print-qr-claim-button"
						onClick={claim_poap}
						color={termsAccepted || !drop_meta?.optin_text ? "primary" : "text"}
					>
						{t("staticClaim.buttons.claim_poap")}
					</Button>
				</Container>
			</Section>

			{/* If this drop has custom CSS associated with it, inject it */}
			<Style styles={drop_meta?.custom_css} />
		</ViewWrapper>
	);
}
