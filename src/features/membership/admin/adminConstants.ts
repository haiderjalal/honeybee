/** Limits for the admin area. Membership rules and money values live in `@/constants/membership`. */

/** Most member search results shown at once. */
export const MEMBER_SEARCH_LIMIT = 50;

/** Phone searches need at least this many digits, so a short query cannot match every member. */
export const MIN_SEARCH_DIGITS = 4;

/** Calendar days in the default reporting window, counting today. */
export const REPORT_WINDOW_DAYS = 30;

/** Longest order reference accepted from a query string or form. */
export const MAX_ORDER_REFERENCE_LENGTH = 120;

/** Longest jar key accepted from a refund form. */
export const MAX_LINE_KEY_LENGTH = 120;

/** Longest free-text reason stored in the audit log. */
export const MAX_REASON_LENGTH = 500;

/** Length of the bank or transfer reference an admin enters to verify a payment. */
export const PAYMENT_REFERENCE_LENGTH = { min: 3, max: 80 } as const;
