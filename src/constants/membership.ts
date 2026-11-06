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

export interface MembershipLaunchFlags {
  /** The membership-fee refund and cancellation policy has been agreed and published. */
  feeRefundPolicyPublished: boolean;
  /** A real payment route for membership fees is configured (online provider, or verified manual transfer). */
  paymentRouteConfigured: boolean;
  /** Admins can verify pending membership payments and correct memberships. */
  adminVerificationAvailable: boolean;
  /** Membership records are stored in a database that has been provisioned and migrated. */
  storageConfigured: boolean;
}

/**
 * Public sales stay closed until every launch requirement is genuinely complete. Flip a flag only once the
 * matching work is done: the sales gate reads these values and never assumes them.
 */
export const MEMBERSHIP_LAUNCH: MembershipLaunchFlags = {
  feeRefundPolicyPublished: false,
  paymentRouteConfigured: false,
  adminVerificationAvailable: false,
  storageConfigured: false,
};
