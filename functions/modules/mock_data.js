const random_number_of_length = (length) => Math.floor(Math.random() * 10 ** length);
const { v4: uuidv4 } = require("uuid");
const { ms_to_dd_month_yyyy } = require("./helpers");

const { MOCK_DROP_ID, MOCK_DROP_ID_SINGLE_CODE, MOCK_DROP_ID_MOCK_STRIPE } = process.env;
const mock_ids = [MOCK_DROP_ID_SINGLE_CODE, MOCK_DROP_ID, MOCK_DROP_ID_MOCK_STRIPE];
exports.is_mock_id = (id) => mock_ids.includes(id);

const yesterday = Date.now() - 1000 * 60 * 60 * 24;
const tomorrow = Date.now() + 1000 * 60 * 60 * 24;
const in_a_week = Date.now() + 1000 * 60 * 60 * 24 * 7;
const tomorrow_ms = new Date(tomorrow).getTime();
const in_a_week_ms = new Date(in_a_week).getTime();

// https://documentation.poap.tech/reference/geteventsid
exports.mock_event = (id) => ({
	id: id || `${random_number_of_length(5)}`,
	name: `Mock event ${random_number_of_length(5)}`,
	city: "Luna",
	country: "Sol",
	description: `The thing that I often ask startups on top of Ethereum is, 'Can you please tell me why using the Ethereum blockchain is better than using Excel?' And if they can come up with a good answer, that's when you know you've got something really interesting. ~ Vitalik`,
	expiry_date: ms_to_dd_month_yyyy(in_a_week_ms),
	start_date: ms_to_dd_month_yyyy(yesterday),
	end_date: ms_to_dd_month_yyyy(tomorrow_ms),
	expires: ms_to_dd_month_yyyy(in_a_week_ms),
	image_url:
		"https://assets.poap.xyz/poap-checkout-internal-live-demo-2022-logo-1670933285929.png",
});

exports.mock_codes_of_event = (quantity = 100) => {
	if (quantity == "random") quantity = random_number_of_length(2);

	const codes = [...Array(quantity)].map(() => ({
		qr_hash: `mock_${random_number_of_length(20)}`,
		claimed: false,
	}));

	return codes;
};

exports.mock_code_status = () => ({
	secret: `mock_${uuidv4()}`,
	claimed: false,
});

exports.mock_successful_claim = (address) => ({
	error: null,
	beneficiary: address,
});

exports.mock_address_that_has_all_poaps = `0x0000000000000000000000000000000000000000`;
exports.mock_address_has_poap = (address) => ({
	event: {
		id: 110084,
		fancy_id: "poap-checkout-gifting-beta-tester-2023",
		name: "POAP Checkout - gifting beta tester",
		event_url: "https://checkout.poap.xyz",
		image_url: "https://assets.poap.xyz/dee8188f-64f3-41d3-ae07-8068efcb0538.png",
		country: "",
		city: "",
		description: "Thank you for helping us test the new POAP  Checkout gifting functionality!",
		year: 2023,
		start_date: "14-Mar-2023",
		end_date: "15-Mar-2023",
		expiry_date: "30-Mar-2023",
	},
	tokenId: "6465773",
	owner: address,
});

exports.mock_stripe_checkout_webhook = ({ amount_total, ...metadata }) => ({
	metadata,
	payment_status: "paid",
	currency: "usd",
	amount_total,
	livemode: false,
});
