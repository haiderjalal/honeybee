/**
 * The HonyB Hive — the single source of truth for membership rules and values.
 * Money is in minor units (paisa, 100 = PKR 1). Edit values here only; the pricing rules, the public page and
 * the term snapshots all read from this file.
 */

export const MEMBERSHIP = {
  name: "The HonyB Hive",
  currency: "PKR",
  /** Annual fee, paid once upfront per term: PKR 999. */
  feeMinor: 99_900,
  /** A term runs for this many calendar months from verified activation. */
  termMonths: 12,
  /** Fixed UTC+5 offset (Asia/Karachi, no daylight saving) used for calendar-month expiry. */
  termUtcOffsetMinutes: 300,
  /** Renewal is always manual: no recurring charges are ever taken. */
  renewal: "manual",
  /** Discounted orders per membership term. */
  discountAllowance: 6,
  /** Discount rate in basis points: 1000 = 10% of the eligible honey subtotal. */
  discountRateBps: 1_000,
  /** Largest discount on one order: PKR 350. */
  maxDiscountPerOrderMinor: 35_000,
  /** Eligible honey subtotal needed before the discount applies: PKR 3,000. */
  minEligibleSubtotalMinor: 300_000,
  /** Renewal reminder lead times, in days before expiry. Reminders also need consent. */
  renewalReminderDays: [30, 7],
} as const;

/** The account members pay the membership fee into. Mobile wallets have no IBAN, so it is optional. */
export interface MembershipBankTransfer {
  /** The payment method members see, for example "Easypaisa" or a bank name. */
  method: string;
  accountTitle: string;
  accountNumber: string;
  iban: string | null;
}

/**
 * Account for membership fees. Null until the account is confirmed. Sales stay closed while this is null, so no
 * account details are invented here.
 */
export const MEMBERSHIP_BANK_TRANSFER: MembershipBankTransfer | null = null;

/**
 * The agreed refund and cancellation policy for membership fees, shown to customers. Null until the policy has been
 * agreed. Sales stay closed while this is null, so no policy is invented here.
 */
export const MEMBERSHIP_FEE_REFUND_POLICY: string | null =
  "Membership fees are non-refundable. This policy does not change refunds on honey orders.";

/** Launch requirements that depend on operations: the database being live and an admin being set up. */
export interface MembershipLaunchFlags {
  /** Admins can verify pending membership payments and correct memberships. */
  adminVerificationAvailable: boolean;
  /** Membership records are stored in a database that has been provisioned and migrated. */
  storageConfigured: boolean;
}

/**
 * Public sales stay closed until every launch requirement is genuinely complete. Flip a flag only once the
 * matching work is done. The policy and bank details above are checked directly, not by a flag.
 */
export const MEMBERSHIP_LAUNCH: MembershipLaunchFlags = {
  adminVerificationAvailable: true,
  storageConfigured: true,
};
