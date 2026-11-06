import { getMembershipDisplayStatus } from "./membershipTerms";

import type {
  MembershipTerm,
  RedemptionCounts,
  RedemptionEvent,
  RedemptionStatus,
  RefundableLine,
  RefundRequestLine,
  RefundResult,
} from "@/types/membership";

/**
 * Redemptions move through reserved → consumed (fulfilled) or released, and a consumed one can be restored by a
 * full refund. Every change here is a pure calculation; the database applies it inside one transaction.
 */

export interface RedemptionChange {
  status: RedemptionStatus;
  counts: RedemptionCounts;
}

const TRANSITIONS: Record<RedemptionStatus, Partial<Record<RedemptionEvent, RedemptionStatus>>> = {
  reserved: { consume: "consumed", release: "released" },
  consumed: { restore: "restored" },
  released: {},
  restored: {},
};

export function getRemainingDiscountAllowance(counts: RedemptionCounts): number {
  return Math.max(0, counts.allowance - counts.used - counts.reserved);
}

/** Why a term cannot take a new reservation, or null when it can. */
export function getTermBlockReason(term: MembershipTerm, now: Date): "term_not_active" | "allowance_used" | null {
  if (getMembershipDisplayStatus(term, now) !== "active") return "term_not_active";
  if (getRemainingDiscountAllowance(toCounts(term)) <= 0) return "allowance_used";
  return null;
}

export function toCounts(term: MembershipTerm): RedemptionCounts {
  return { allowance: term.discountAllowance, used: term.discountsUsed, reserved: term.discountsReserved };
}

/** Reserves one redemption when the order is created. Returns null when the allowance is already committed. */
export function reserveRedemption(counts: RedemptionCounts): RedemptionChange | null {
  if (getRemainingDiscountAllowance(counts) <= 0) return null;
  return { status: "reserved", counts: { ...counts, reserved: counts.reserved + 1 } };
}

/**
 * Applies a lifecycle event to an existing redemption. Returns null for transitions that are not allowed, so a
 * duplicate or out-of-order event never changes the counters.
 */
export function applyRedemptionEvent(
  current: RedemptionChange,
  event: Exclude<RedemptionEvent, "reserve">,
): RedemptionChange | null {
  const next = TRANSITIONS[current.status][event];
  if (!next) return null;

  const { counts } = current;
  switch (event) {
    case "consume":
      return { status: next, counts: { ...counts, reserved: counts.reserved - 1, used: counts.used + 1 } };
    case "release":
      return { status: next, counts: { ...counts, reserved: counts.reserved - 1 } };
    case "restore":
      // Restores capacity to the original term only. Dates are never changed, so the term is not extended.
      return { status: next, counts: { ...counts, used: counts.used - 1 } };
  }
}

/**
 * How each lifecycle event moves the term's counters. Kept beside the transition table so the database change and
 * the state machine cannot drift apart.
 */
export function getRedemptionCountDeltas(event: Exclude<RedemptionEvent, "reserve">): {
  usedDelta: number;
  reservedDelta: number;
} {
  switch (event) {
    case "consume":
      return { usedDelta: 1, reservedDelta: -1 };
    case "release":
      return { usedDelta: 0, reservedDelta: -1 };
    case "restore":
      return { usedDelta: -1, reservedDelta: 0 };
  }
}

/** The status a redemption moves to for an event, or null when that move is not allowed. */
export function getNextRedemptionStatus(
  current: RedemptionStatus,
  event: Exclude<RedemptionEvent, "reserve">,
): RedemptionStatus | null {
  return TRANSITIONS[current][event] ?? null;
}

/** Cumulative share of`total` for the first `count` units out of `quantity`. The final unit takes the remainder. */
function cumulativeShare(total: number, quantity: number, count: number): number {
  return count >= quantity ? total : Math.floor((total * count) / quantity);
}

/**
 * Works out what a refund returns. Each request is measured cumulatively against the original allocation, so
 * repeated partial refunds add up exactly to the original paid amount and discount.
 */
export function calculateRefund(lines: readonly RefundableLine[], request: readonly RefundRequestLine[]): RefundResult {
  const requested = new Map<string, number>();
  for (const item of request) {
    if (!lines.some((line) => line.lineId === item.lineId)) return { ok: false, reason: "unknown_line" };
    if (requested.has(item.lineId)) return { ok: false, reason: "invalid_quantity" };
    requested.set(item.lineId, item.quantity);
  }

  let refundedPaidMinor = 0;
  let reversedDiscountMinor = 0;
  let isFullRefund = true;

  for (const line of lines) {
    const quantity = requested.get(line.lineId) ?? 0;
    const remaining = line.quantity - line.refundedQuantity;
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > remaining) {
      return { ok: false, reason: "invalid_quantity" };
    }

    const after = line.refundedQuantity + quantity;
    const paidMinor = line.lineTotalMinor - line.discountMinor;
    refundedPaidMinor +=
      cumulativeShare(paidMinor, line.quantity, after) -
      cumulativeShare(paidMinor, line.quantity, line.refundedQuantity);
    reversedDiscountMinor +=
      cumulativeShare(line.discountMinor, line.quantity, after) -
      cumulativeShare(line.discountMinor, line.quantity, line.refundedQuantity);

    if (after !== line.quantity) isFullRefund = false;
  }

  return { ok: true, refundedPaidMinor, reversedDiscountMinor, isFullRefund };
}

/**
 * Savings count only once an order is fulfilled, and only what was not reversed by a refund. Reserved, released
 * and unpaid orders never count as savings.
 */
export function getActualSavingsMinor(redemption: {
  status: RedemptionStatus;
  discountMinor: number;
  reversedDiscountMinor: number;
}): number {
  if (redemption.status !== "consumed" && redemption.status !== "restored") return 0;
  return Math.max(0, redemption.discountMinor - redemption.reversedDiscountMinor);
}
