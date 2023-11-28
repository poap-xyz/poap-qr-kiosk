import { useEffect, useState } from "react";
import { log } from "../modules/helpers";
import { useSearchParams } from "react-router-dom";

export const useProbableMintAddress = () => {
	const [cached_address, set_cached_address] = useState();
	const [url_address, set_url_address] = useState();
	const [search_params] = useSearchParams("user_address");

	// On hook mount, check url query for url
	useEffect(() => {
		// Check if user_address was passed in the query string
		const user_address = search_params.get("user_address");
		log(`Probable address from URL: `, user_address);
		set_url_address(user_address || false);
	}, [search_params]);

	// On hook mount, check local storage for cached address
	useEffect(() => {
		// Check if user_address was passed in the query string
		const cached_address = localStorage.getItem("cached_address");
		log(`Probable address from cache: `, cached_address);
		set_cached_address(cached_address || false);
	}, []);

	// If there is an address in the url, but not in the localstorage, cache it
	useEffect(() => {
		// If either the url or cache has not been loaded yet, exit
		if (cached_address === undefined || url_address === undefined) return;

		// If there is an address in the url, cache it
		if (url_address) localStorage.setItem("cached_address", url_address);
	}, [url_address, cached_address]);

	// Return the most probable address, where url gets priority over cache
	return {
		probable_user_address: url_address || cached_address,
		address_in_query: url_address,
		address_in_cache: cached_address,
	};
};
