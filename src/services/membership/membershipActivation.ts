import { MEMBERSHIP } from "@/constants/membership";

import { getTermWindow, isWithinTerm } from "./membershipTerms";

import type {
  ActivationDecision,
  MembershipPurchaseState,
  MembershipTerm,
  PurchaseStartDecision,
  VerifiedPaymentEvent,
} from "@/types/membership";

/**
 * Decides whether a verified fee payment activates a term. Only a server-verified payment may activate, so a browser
 * success redirect or an uploaded screenshot never reaches this function as verified. The database must also apply
 * these decisions inside one transaction, with a unique constraint on the provider reference.
 */
export function decideActivation(input: {
  purchase: MembershipPurchaseState;
  payment: VerifiedPaymentEvent;
  customerTerm: MembershipTerm | null;
}): ActivationDecision {
  const { purchase, payment, customerTerm } = input;

  if (!payment.verified) return { action: "reject", reason: "not_verified" };

  // A repeated callback for an activated purchase is a no-op, so retries never create a second term.
  if (purchase.status === "verified") {
    return purchase.termId
      ? { action: "already_activated", termId: purchase.termId }
      : { action: "reject", reason: "purchase_closed" };
  }
  if (purchase.status !== "awaiting_payment" && purchase.status !== "pending_verification") {
    return { action: "reject", reason: "purchase_closed" };
  }

  if (payment.amountMinor !== MEMBERSHIP.feeMinor) return { action: "reject", reason: "amount_mismatch" };
  if (customerTerm && customerTerm.status !== "active") return { action: "reject", reason: "membership_blocked" };
  if (customerTerm && isWithinTerm(customerTerm, payment.verifiedAt)) {
    return { action: "reject", reason: "already_member" };
  }

  return { action: "activate", ...getTermWindow(payment.verifiedAt) };
}

/**
 * Decides whether a customer may start a fee purchase. Renewal is offered only after the current term has expired,
 * so an active member cannot buy a second term for the same verified phone.
 */
export function decidePurchaseStart(input: {
  customerTerm: MembershipTerm | null;
  hasOpenPurchase: boolean;
  now: Date;
}): PurchaseStartDecision {
  const { customerTerm, hasOpenPurchase, now } = input;

  if (hasOpenPurchase) return { ok: false, reason: "purchase_open" };
  if (customerTerm && customerTerm.status !== "active") return { ok: false, reason: "membership_blocked" };
  if (customerTerm && isWithinTerm(customerTerm, now)) return { ok: false, reason: "already_active" };

  return { ok: true, purpose: customerTerm ? "renewal" : "new" };
}
