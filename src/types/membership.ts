/** Membership domain types. All amounts are integer minor units (paisa). */

/** What a basket line is. Only honey merchandise can earn the membership discount. */
export type MembershipLineKind = "honey" | "non_honey" | "delivery" | "membership_fee" | "gift_card";

export interface DiscountLine {
  id: string;
  kind: MembershipLineKind;
  /** Quantity × unit price at the current catalogue price, in minor units. */
  lineTotalMinor: number;
  /** Sold at a sale price. Membership does not combine with sale prices, so these lines are excluded. */
  onSale: boolean;
}

/** Any other offer on the order (for example a coupon). Only one promotion applies per order. */
export interface PromotionOption {
  id: string;
  label: string;
  discountMinor: number;
}

/** Why a customer's membership cannot discount this order. Used to explain the outcome; never blocks checkout. */
export type MembershipIneligibleReason =
  "no_membership" | "term_not_active" | "allowance_used" | "no_eligible_items" | "below_minimum";

/** Stored on a term. A term only exists once its fee payment is verified, so there is no stored "pending" state. */
export type MembershipStatus = "active" | "suspended" | "cancelled";

/** The stored membership term. Expiry is derived from dates, so an "active" term can still be expired. */
export interface MembershipTerm {
  id: string;
  status: MembershipStatus;
  startsAt: Date;
  expiresAt: Date;
  discountAllowance: number;
  /** Redemptions consumed by fulfilled orders. */
  discountsUsed: number;
  /** Redemptions held by orders that are not yet fulfilled. */
  discountsReserved: number;
}

/** What a customer, or the dashboard, sees. "none" means the customer has never held a term. */
export type MembershipDisplayStatus = "none" | "pending_payment" | "active" | "expired" | "suspended" | "cancelled";

export interface MembershipQuote {
  eligibleLineIds: string[];
  eligibleSubtotalMinor: number;
  meetsMinimum: boolean;
  /** The discount before the per-order cap was applied. */
  uncappedDiscountMinor: number;
  discountMinor: number;
  capped: boolean;
  /** How the discount is split across lines, so partial refunds return exactly what was paid. */
  allocations: { lineId: string; discountMinor: number }[];
}

export type PromotionCandidate =
  | { kind: "membership"; discountMinor: number }
  | { kind: "promotion"; id: string; label: string; discountMinor: number };

/** The single promotion applied to an order, or "none" when nothing applies. */
export type PromotionChoice = { kind: "none"; discountMinor: 0 } | PromotionCandidate;

export interface MemberOrderDecision {
  /** Null when the membership discount is available for this order. */
  membershipIneligibleReason: MembershipIneligibleReason | null;
  quote: MembershipQuote;
  choice: PromotionChoice;
  /** Every promotion that could apply, so checkout can explain why the chosen one won. */
  candidates: PromotionCandidate[];
}

export type RedemptionStatus = "reserved" | "consumed" | "released" | "restored";

export type RedemptionEvent = "reserve" | "consume" | "release" | "restore";

export interface RedemptionCounts {
  allowance: number;
  used: number;
  reserved: number;
}

export interface RefundableLine {
  lineId: string;
  quantity: number;
  /** Quantity already refunded on earlier requests. */
  refundedQuantity: number;
  lineTotalMinor: number;
  /** This line's share of the order discount, from the original allocation. */
  discountMinor: number;
}

export interface RefundRequestLine {
  lineId: string;
  quantity: number;
}

export interface RefundTotals {
  /** The amount actually paid for the returned items, after the discount share. */
  refundedPaidMinor: number;
  /** The part of the recorded discount that is now reversed. */
  reversedDiscountMinor: number;
  /** True when every unit of every line is now refunded. Only a full refund restores the benefit. */
  isFullRefund: boolean;
}

export type RefundResult = ({ ok: true } & RefundTotals) | { ok: false; reason: "unknown_line" | "invalid_quantity" };

/** The fee-payment state needed to decide whether a verified payment may activate a term. */
export type MembershipPaymentStatus = "awaiting_payment" | "pending_verification" | "verified" | "failed" | "cancelled";

export interface MembershipPurchaseState {
  id: string;
  status: MembershipPaymentStatus;
  purpose: "new" | "renewal";
  /** The term this payment activated, once it has. */
  termId: string | null;
}

export interface VerifiedPaymentEvent {
  /** Provider or bank reference. Repeated callbacks for the same reference must not activate twice. */
  providerReference: string;
  amountMinor: number;
  /** True only after the server has verified the payment with the provider or an admin. */
  verified: boolean;
  verifiedAt: Date;
}

export type ActivationDecision =
  | { action: "activate"; startsAt: Date; expiresAt: Date }
  | { action: "already_activated"; termId: string }
  | {
      action: "reject";
      reason: "not_verified" | "purchase_closed" | "amount_mismatch" | "already_member" | "membership_blocked";
    };

export type PurchaseStartDecision =
  | { ok: true; purpose: "new" | "renewal" }
  | { ok: false; reason: "already_active" | "membership_blocked" | "purchase_open" };
