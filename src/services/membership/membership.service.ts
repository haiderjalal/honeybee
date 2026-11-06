import { MEMBERSHIP } from "@/constants/membership";
import { normalizePakistaniMobile } from "@/utils/phone";

import { decideActivation, decidePurchaseStart } from "./membershipActivation";
import { decideMemberOrder } from "./membershipDiscount";
import { isMembershipSalesOpen } from "./membershipSalesGate";
import {
  calculateRefund,
  getActualSavingsMinor,
  getNextRedemptionStatus,
  getRedemptionCountDeltas,
  getRemainingDiscountAllowance,
  toCounts,
} from "./membershipRedemptions";
import { getMembershipDisplayStatus, isWithinTerm } from "./membershipTerms";
import { MembershipDbError } from "./membership.repository";

import type {
  AccountPurchaseSummary,
  AccountSnapshot,
  MembershipRepository,
  ReportTotals,
  StoredRedemption,
  StoredRedemptionLine,
  StoredTerm,
} from "./membership.repository";
import type {
  DiscountLine,
  MemberOrderDecision,
  MembershipDisplayStatus,
  PurchaseStartDecision,
  RedemptionStatus,
  RefundableLine,
} from "@/types/membership";

/** A business rule refused the request. `code` is safe to map to a message. */
export class MembershipServiceError extends Error {
  constructor(readonly code: string) {
    super(`membership: ${code}`);
    this.name = "MembershipServiceError";
  }
}

/**
 * Who made a change and why. Every order lifecycle change needs one, and the database writes it to the audit log in
 * the same transaction as the change. Admin actions use the admin's email; the checkout uses a named system actor.
 */
export interface AuditContext {
  actor: string;
  reason: string;
}

function assertAudit(audit: AuditContext): void {
  if (audit.actor.trim() === "") throw new MembershipServiceError("actor_required");
  if (audit.reason.trim() === "") throw new MembershipServiceError("reason_required");
}

function auditPayload(audit: AuditContext, action: string) {
  return { actor: audit.actor, reason: audit.reason.trim(), auditAction: action };
}

/** The term that matters now: one live at `now`, otherwise the most recent. */
export function selectCurrentTerm(terms: readonly StoredTerm[], now: Date): StoredTerm | null {
  const live = terms.find((term) => term.status === "active" && isWithinTerm(term, now));
  if (live) return live;
  return [...terms].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0] ?? null;
}

const OPEN_PURCHASE_STATUSES = new Set(["awaiting_payment", "pending_verification"]);

function findOpenPurchase(purchases: readonly AccountPurchaseSummary[]): AccountPurchaseSummary | null {
  return purchases.find((purchase) => OPEN_PURCHASE_STATUSES.has(purchase.status)) ?? null;
}

export interface AccountView {
  status: MembershipDisplayStatus;
  term: StoredTerm | null;
  openPurchase: AccountPurchaseSummary | null;
  allowance: { total: number; used: number; reserved: number; remaining: number } | null;
  /** Savings from fulfilled orders, net of refunds. Reserved and released orders never count. */
  savingsMinor: number;
  redemptions: StoredRedemption[];
  purchases: AccountPurchaseSummary[];
  /** Whether a fee purchase can start, and whether it is a new membership or a renewal. */
  purchaseStart: PurchaseStartDecision;
  reminderPreferences: AccountSnapshot["reminderPreferences"];
}

export async function getAccountView(repo: MembershipRepository, userId: string, now: Date): Promise<AccountView> {
  const snapshot = await repo.getAccountSnapshot(userId);
  const term = selectCurrentTerm(snapshot.terms, now);
  const openPurchase = findOpenPurchase(snapshot.purchases);

  return {
    status: getMembershipDisplayStatus(term, now, openPurchase !== null),
    term,
    openPurchase,
    allowance: term
      ? {
          total: term.discountAllowance,
          used: term.discountsUsed,
          reserved: term.discountsReserved,
          remaining: getRemainingDiscountAllowance(toCounts(term)),
        }
      : null,
    savingsMinor: snapshot.redemptions.reduce((sum, redemption) => sum + getActualSavingsMinor(redemption), 0),
    redemptions: snapshot.redemptions,
    purchases: snapshot.purchases,
    purchaseStart: decidePurchaseStart({ customerTerm: term, hasOpenPurchase: openPurchase !== null, now }),
    reminderPreferences: snapshot.reminderPreferences,
  };
}

/** Opens a fee purchase for the signed-in customer. Public sales stay closed until the launch gate opens. */
export async function startFeePurchase(
  repo: MembershipRepository,
  input: { userId: string; phone: string; now: Date },
) {
  if (!isMembershipSalesOpen()) throw new MembershipServiceError("sales_closed");

  const phone = normalizePakistaniMobile(input.phone);
  if (!phone) throw new MembershipServiceError("invalid_phone");

  const snapshot = await repo.getAccountSnapshot(input.userId);
  const decision = decidePurchaseStart({
    customerTerm: selectCurrentTerm(snapshot.terms, input.now),
    hasOpenPurchase: findOpenPurchase(snapshot.purchases) !== null,
    now: input.now,
  });
  if (!decision.ok) throw new MembershipServiceError(decision.reason);

  return repo.createPurchase({
    userId: input.userId,
    phone,
    purpose: decision.purpose,
    amountMinor: MEMBERSHIP.feeMinor,
  });
}

/** Stores the reference the customer gives for their transfer. This is a claim, not proof, so nothing activates. */
export async function submitPaymentReference(
  repo: MembershipRepository,
  input: { userId: string; purchaseId: string; reference: string },
) {
  const reference = input.reference.trim();
  if (reference.length < 3 || reference.length > 80) throw new MembershipServiceError("invalid_reference");
  return repo.submitReference({ userId: input.userId, purchaseId: input.purchaseId, reference });
}

/**
 * Verifies a fee payment and activates the term. Only an admin calls this after checking the bank statement, so
 * a browser redirect or an uploaded screenshot can never activate a term.
 */
export async function verifyFeePayment(
  repo: MembershipRepository,
  input: { purchaseId: string; providerReference: string; actor: string; reason?: string; now: Date },
): Promise<{ result: "activated" | "already_activated"; termId: string }> {
  const found = await repo.findPurchase(input.purchaseId);
  if (!found) throw new MembershipServiceError("purchase_not_found");

  const decision = decideActivation({
    purchase: {
      id: found.purchase.id,
      status: found.purchase.status,
      purpose: found.purchase.purpose,
      termId: found.purchase.termId,
    },
    payment: {
      providerReference: input.providerReference,
      amountMinor: found.purchase.amountMinor,
      verified: true,
      verifiedAt: input.now,
    },
    customerTerm: selectCurrentTerm(found.customerTerms, input.now),
  });

  if (decision.action === "reject") throw new MembershipServiceError(decision.reason);
  if (decision.action === "already_activated") return { result: "already_activated", termId: decision.termId };

  return repo.verifyPayment({
    purchaseId: input.purchaseId,
    provider: "manual",
    providerReference: input.providerReference,
    amountMinor: found.purchase.amountMinor,
    actor: input.actor,
    reason: input.reason?.trim() || "Fee payment verified",
    startsAt: decision.startsAt,
    expiresAt: decision.expiresAt,
    rules: {
      feeMinor: MEMBERSHIP.feeMinor,
      discountAllowance: MEMBERSHIP.discountAllowance,
      discountRateBps: MEMBERSHIP.discountRateBps,
      maxDiscountPerOrderMinor: MEMBERSHIP.maxDiscountPerOrderMinor,
      minEligibleSubtotalMinor: MEMBERSHIP.minEligibleSubtotalMinor,
    },
  });
}

export interface OrderDiscountLine {
  /** Stable key for the line, e.g. "sidr-honey:1kg". */
  lineKey: string;
  quantity: number;
  /** Quantity × unit price at the current catalogue price, in minor units. */
  lineTotalMinor: number;
  /** Sold at a sale price, so membership does not apply to this line. */
  onSale: boolean;
}

export type OrderMembershipOutcome = MemberOrderDecision & { reserved: boolean };

/**
 * Prices and reserves the member discount for a new order. The order still goes through when no discount applies,
 * so checkout never fails because of membership.
 */
export async function reserveMemberDiscount(
  repo: MembershipRepository,
  input: { customerUserId: string; orderReference: string; lines: readonly OrderDiscountLine[]; now: Date },
): Promise<OrderMembershipOutcome> {
  const snapshot = await repo.getAccountSnapshot(input.customerUserId);
  const term = selectCurrentTerm(snapshot.terms, input.now);

  const discountLines: DiscountLine[] = input.lines.map((line) => ({
    id: line.lineKey,
    kind: "honey",
    lineTotalMinor: line.lineTotalMinor,
    onSale: line.onSale,
  }));
  const decision = decideMemberOrder({ term, now: input.now, lines: discountLines });

  if (decision.choice.kind !== "membership" || !term) {
    return { ...decision, reserved: false };
  }

  const shares = new Map(decision.quote.allocations.map((allocation) => [allocation.lineId, allocation.discountMinor]));
  try {
    // A repeated call for the same order returns the existing reservation, so retries never count twice.
    await repo.reserveRedemption({
      termId: term.id,
      orderReference: input.orderReference,
      eligibleSubtotalMinor: decision.quote.eligibleSubtotalMinor,
      discountMinor: decision.choice.discountMinor,
      lines: input.lines.map((line) => ({
        lineKey: line.lineKey,
        quantity: line.quantity,
        lineTotalMinor: line.lineTotalMinor,
        discountMinor: shares.get(line.lineKey) ?? 0,
      })),
    });
    return { ...decision, reserved: true };
  } catch (error) {
    // A competing checkout took the last allowance after we read it. The order continues at regular prices.
    if (error instanceof MembershipDbError && (error.code === "allowance_used" || error.code === "term_not_active")) {
      return {
        ...decision,
        reserved: false,
        membershipIneligibleReason: error.code === "allowance_used" ? "allowance_used" : "term_not_active",
        choice: { kind: "none", discountMinor: 0 },
      };
    }
    throw error;
  }
}

/** Moves a reserved order to consumed once it is fulfilled. Repeating the call after success changes nothing. */
export async function fulfilMemberOrder(
  repo: MembershipRepository,
  orderReference: string,
  audit: AuditContext,
): Promise<RedemptionStatus> {
  assertAudit(audit);
  const found = await repo.findRedemption(orderReference);
  if (!found) throw new MembershipServiceError("redemption_not_found");

  const { redemption } = found;
  const next = getNextRedemptionStatus(redemption.status, "consume");
  if (!next) return redemption.status;

  const deltas = getRedemptionCountDeltas("consume");
  return repo.applyRedemptionChange({
    orderReference,
    ...auditPayload(audit, "redemption.fulfilled"),
    expectedStatus: redemption.status,
    newStatus: next,
    usedDelta: deltas.usedDelta,
    reservedDelta: deltas.reservedDelta,
    expectedReversedMinor: redemption.reversedDiscountMinor,
    newReversedMinor: redemption.reversedDiscountMinor,
    expectedRefundedMinor: redemption.refundedPaidMinor,
    newRefundedMinor: redemption.refundedPaidMinor,
  });
}

/**
 * Releases a reservation when payment fails, the unpaid order expires, the order is cancelled, or a cash-on-delivery
 * order is rejected or fails delivery. Calling it again does nothing once the reservation is released.
 */
export async function releaseMemberOrder(
  repo: MembershipRepository,
  orderReference: string,
  audit: AuditContext,
): Promise<RedemptionStatus | null> {
  assertAudit(audit);
  const found = await repo.findRedemption(orderReference);
  if (!found) return null;

  const { redemption } = found;
  const next = getNextRedemptionStatus(redemption.status, "release");
  if (!next) return redemption.status;

  const deltas = getRedemptionCountDeltas("release");
  return repo.applyRedemptionChange({
    orderReference,
    ...auditPayload(audit, "redemption.released"),
    expectedStatus: redemption.status,
    newStatus: next,
    usedDelta: deltas.usedDelta,
    reservedDelta: deltas.reservedDelta,
    expectedReversedMinor: redemption.reversedDiscountMinor,
    newReversedMinor: redemption.reversedDiscountMinor,
    expectedRefundedMinor: redemption.refundedPaidMinor,
    newRefundedMinor: redemption.refundedPaidMinor,
  });
}

/**
 * Refunds some or all units of a fulfilled member order. Refunds return the amount actually paid for the units and
 * reverse their discount share. Only a full refund restores the benefit, and only to the original term.
 */
export async function refundMemberOrder(
  repo: MembershipRepository,
  input: { orderReference: string; refund: { lineKey: string; quantity: number }[]; audit: AuditContext },
): Promise<{
  status: RedemptionStatus;
  refundedPaidMinor: number;
  reversedDiscountMinor: number;
  isFullRefund: boolean;
}> {
  assertAudit(input.audit);
  const found = await repo.findRedemption(input.orderReference);
  if (!found) throw new MembershipServiceError("redemption_not_found");

  const { redemption, lines } = found;
  if (redemption.status === "restored") throw new MembershipServiceError("already_refunded");
  if (redemption.status !== "consumed") throw new MembershipServiceError("not_fulfilled");

  const refundable: RefundableLine[] = lines.map((line: StoredRedemptionLine) => ({
    lineId: line.lineKey,
    quantity: line.quantity,
    refundedQuantity: line.refundedQuantity,
    lineTotalMinor: line.lineTotalMinor,
    discountMinor: line.discountMinor,
  }));
  const result = calculateRefund(
    refundable,
    input.refund.map((item) => ({ lineId: item.lineKey, quantity: item.quantity })),
  );
  if (!result.ok) throw new MembershipServiceError(result.reason);

  const requested = new Map(input.refund.map((item) => [item.lineKey, item.quantity]));
  const lineRefunds = lines
    .filter((line) => (requested.get(line.lineKey) ?? 0) > 0)
    .map((line) => ({
      lineKey: line.lineKey,
      refundedQuantity: line.refundedQuantity + (requested.get(line.lineKey) ?? 0),
    }));

  const deltas = result.isFullRefund ? getRedemptionCountDeltas("restore") : { usedDelta: 0, reservedDelta: 0 };
  const status = await repo.applyRedemptionChange({
    orderReference: input.orderReference,
    ...auditPayload(input.audit, result.isFullRefund ? "redemption.restored" : "redemption.refunded"),
    expectedStatus: "consumed",
    newStatus: result.isFullRefund ? "restored" : "consumed",
    usedDelta: deltas.usedDelta,
    reservedDelta: deltas.reservedDelta,
    expectedReversedMinor: redemption.reversedDiscountMinor,
    newReversedMinor: redemption.reversedDiscountMinor + result.reversedDiscountMinor,
    expectedRefundedMinor: redemption.refundedPaidMinor,
    newRefundedMinor: redemption.refundedPaidMinor + result.refundedPaidMinor,
    lineRefunds,
  });

  return {
    status,
    refundedPaidMinor: result.refundedPaidMinor,
    reversedDiscountMinor: result.reversedDiscountMinor,
    isFullRefund: result.isFullRefund,
  };
}

/** Admin correction. The reason is required and is recorded in the audit log in the same transaction. */
export async function correctMemberTerm(
  repo: MembershipRepository,
  input: {
    termId: string;
    actor: string;
    reason: string;
    status?: StoredTerm["status"];
    expiresAt?: Date;
    discountsUsed?: number;
  },
): Promise<StoredTerm> {
  const reason = input.reason.trim();
  if (reason.length === 0) throw new MembershipServiceError("reason_required");
  return repo.correctTerm({ ...input, reason });
}

export type MemberQuote =
  | { signedIn: false }
  | {
      signedIn: true;
      applied: boolean;
      discountMinor: number;
      ineligibleReason: MemberOrderDecision["membershipIneligibleReason"];
      eligibleSubtotalMinor: number;
      /** How much more regular-price honey is needed to reach the minimum. Zero when already met. */
      shortfallMinor: number;
    };

/**
 * Previews the member discount for a basket without reserving anything. It is only advice for the checkout screen:
 * the order itself recalculates and reserves at submission.
 */
export async function quoteMemberDiscount(
  repo: MembershipRepository,
  input: { customerUserId: string; lines: readonly OrderDiscountLine[]; now: Date },
): Promise<MemberQuote> {
  const snapshot = await repo.getAccountSnapshot(input.customerUserId);
  const decision = decideMemberOrder({
    term: selectCurrentTerm(snapshot.terms, input.now),
    now: input.now,
    lines: input.lines.map((line) => ({
      id: line.lineKey,
      kind: "honey",
      lineTotalMinor: line.lineTotalMinor,
      onSale: line.onSale,
    })),
  });

  const applied = decision.choice.kind === "membership";
  return {
    signedIn: true,
    applied,
    discountMinor: applied ? decision.choice.discountMinor : 0,
    ineligibleReason: decision.membershipIneligibleReason,
    eligibleSubtotalMinor: decision.quote.eligibleSubtotalMinor,
    shortfallMinor: decision.quote.meetsMinimum
      ? 0
      : Math.max(0, MEMBERSHIP.minEligibleSubtotalMinor - decision.quote.eligibleSubtotalMinor),
  };
}

export async function getMembershipReport(repo: MembershipRepository, from: Date, to: Date): Promise<ReportTotals> {
  if (to.getTime() <= from.getTime()) throw new MembershipServiceError("invalid_period");
  return repo.getReport(from, to);
}
