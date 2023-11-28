// TLDs may be 1-63 characters long, see https://www.rfc-editor.org/rfc/rfc1034
export const eth_address_or_ens_regex = /(0x[a-fA-F0-9]{40})|(.*\.[a-z]{2,63})/i;

// Very naive regex validation for email addresses
export const valid_email_regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
