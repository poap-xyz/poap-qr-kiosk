import { trackEvent } from "../modules/firebase";
import { serveToast } from "../components/molecules/Toast";

export const clipboard = async (url, content) => {
	try {
		await navigator.clipboard.writeText(url);

		const message = content || "Copied to clipboard";
		const type = "success";
		const duration = 2000;

		serveToast({ message: message, type: type, duration: duration });
		trackEvent("admin_link_copied_clipboard");
	} catch (error) {
		// Handle any clipboard write errors here
		console.error("Clipboard write failed:", error);
	}
};
