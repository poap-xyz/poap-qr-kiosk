import { useEffect, useState } from "react";
import { listen_to_document, check_code_status } from "../modules/firebase";
import { log, wait } from "../modules/helpers";

export function useCodeMetadata(claim_code, do_nothing = false) {
	const [event, set_event] = useState("loading");
	const [claimed, set_claimed] = useState("loading");
	const [drop_meta, set_drop_meta] = useState("loading");

	// Get event meta from claim_code
	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				// Get remote event data
				if (!claim_code || do_nothing) return;
				log(`Getting event meta for ${claim_code}`);
				const { data } = await check_code_status(claim_code);
				log(`Received event meta for ${claim_code}: `, data.event);
				if (cancelled) return;

				// Set changed data to state
				set_event(data.event);
				set_claimed(data.claimed);
			} catch (e) {
				log(`Error getting event meta for `, claim_code, e);
			}
		})();

		return () => (cancelled = true);
	}, [claim_code]);

	useEffect(() => {
		let cancelled = false;
		let unsubscribe = undefined;

		(async () => {
			try {
				// Log whether we can listen
				if (!event?.id) {
					await wait(1000);
					if (cancelled) return;
					log(`No drop ID available for ${claim_code}, setting to empty. `);
					return set_drop_meta(undefined);
				}

				log(`Starting listener for static_drop_public/${event.id}`);

				// Handle mock event listening for CI
				if (`${event?.id}`.includes(`mock`)) {
					await wait(2000);
					set_drop_meta({
						welcome_text:
							"Input your email below to claim your POAP! This text can be edited for each drop :)",
						optin_text:
							"I accept the terms and conditions, and sign away my soul. This field accepts html for links to external pages.",
						custom_css: `
                            body { background: url("https://images.unsplash.com/photo-1543722530-d2c3201371e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2374&q=80" )}
                            body { background-size: cover }
                            #static-print-qr-h1 { color: brown }
                            #static-print-qr-welcome-text, #static-print-qr-optin-field {
                                background: black;
                                color: white;
                                padding: 0.5rem;
                                font-family: monospace;
                            }
                            #static-print-qr-claim-button, input {
                                background: white!important;
                            }
                        `,
					});

					return () => log(`Removed mock listener`);
				}

				// Return unlistener
				unsubscribe = listen_to_document(`static_drop_public`, `${event.id}`, (meta) => {
					log(`Drop meta: `, meta);
					set_drop_meta(meta);
				});
			} catch (e) {
				log(`Issue getting event metadata`);
			}
		})();

		return () => {
			if (unsubscribe) {
				log(`🛑 removed listener`);
				unsubscribe();
			}
			cancelled = true;
		};
	}, [event?.id]);

	const collated_metadata = {
		event,
		claimed,
		drop_meta,
	};

	return collated_metadata;
}
