import { MEMBERSHIP } from "@/constants/membership";
import { percentOfMinor } from "@/utils/money";

import { getTermBlockReason } from "./membershipRedemptions";

import type {
  DiscountLine,
  MemberOrderDecision,
  MembershipIneligibleReason,
  MembershipQuote,
  MembershipTerm,
  PromotionCandidate,
  PromotionChoice,
  PromotionOption,
} from "@/types/membership";

/** Honey at regular price. Sale lines, delivery, membership fees, gift cards and non-honey items never qualify. */
export function isMembershipEligibleLine(line: DiscountLine): boolean {
  return line.kind === "honey" && !line.onSale && line.lineTotalMinor > 0;
}

/**
 * Splits `total` across weighted parts so the shares add up to exactly `total`. Each part first takes its floor
 * share, then the leftover minor units go to the largest remainders, with earlier lines winning ties.
 */
export function allocateProportionally(
  total: number,
  parts: readonly { id: string; weight: number }[],
): Map<string, number> {
  const weightSum = parts.reduce((sum, part) => sum + part.weight, 0);
  const shares = new Map<string, number>();
  if (weightSum === 0) {
    for (const part of parts) shares.set(part.id, 0);
    return shares;
  }

  const ranked = parts.map((part, index) => {
    const exact = total * part.weight;
    return { id: part.id, index, floor: Math.floor(exact / weightSum), remainder: exact % weightSum };
  });
  let leftover = total - ranked.reduce((sum, part) => sum + part.floor, 0);
  const byRemainder = [...ranked].sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const part of byRemainder) {
    if (leftover === 0) break;
    part.floor += 1;
    leftover -= 1;
  }
  for (const part of ranked) shares.set(part.id, part.floor);
  return shares;
}

/**
 * Prices the membership discount for a basket. The discount is 10% of the eligible honey subtotal, capped per
 * order, and nothing applies below the minimum eligible subtotal.
 */
export function quoteMembershipDiscount(lines: readonly DiscountLine[]): MembershipQuote {
  const eligible = lines.filter(isMembershipEligibleLine);
  const eligibleSubtotalMinor = eligible.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  const meetsMinimum = eligibleSubtotalMinor >= MEMBERSHIP.minEligibleSubtotalMinor;

  const uncappedDiscountMinor = meetsMinimum ? percentOfMinor(eligibleSubtotalMinor, MEMBERSHIP.discountRateBps) : 0;
  const discountMinor = Math.min(uncappedDiscountMinor, MEMBERSHIP.maxDiscountPerOrderMinor, eligibleSubtotalMinor);

  const shares = allocateProportionally(
    discountMinor,
    eligible.map((line) => ({ id: line.id, weight: line.lineTotalMinor })),
  );

  return {
    eligibleLineIds: eligible.map((line) => line.id),
    eligibleSubtotalMinor,
    meetsMinimum,
    uncappedDiscountMinor,
    discountMinor,
    capped: uncappedDiscountMinor > MEMBERSHIP.maxDiscountPerOrderMinor,
    // Every line appears, so partial refunds can look up each line's share directly.
    allocations: lines.map((line) => ({ lineId: line.id, discountMinor: shares.get(line.id) ?? 0 })),
  };
}

/** Why the membership discount cannot apply to this order, checked in the order a customer would need to fix them. */
export function getMembershipIneligibleReason(
  term: MembershipTerm | null,
  now: Date,
  quote: MembershipQuote,
): MembershipIneligibleReason | null {
  if (!term) return "no_membership";
  const termReason = getTermBlockReason(term, now);
  if (termReason) return termReason;
  if (quote.eligibleLineIds.length === 0) return "no_eligible_items";
  if (!quote.meetsMinimum) return "below_minimum";
  return null;
}

export interface MemberOrderInput {
  /** The verified customer's term, or null when they have none. Ownership is checked by the caller. */
  term: MembershipTerm | null;
  now: Date;
  lines: readonly DiscountLine[];
  /** Other offers on this order. The membership discount never combines with them. */
  otherPromotions?: readonly PromotionOption[];
}

/**
 * Decides the single best promotion for an order. The membership discount competes with any other offer, and the
 * larger saving wins. A tie goes to the membership discount.
 */
export function decideMemberOrder(input: MemberOrderInput): MemberOrderDecision {
  const quote = quoteMembershipDiscount(input.lines);
  const membershipIneligibleReason = getMembershipIneligibleReason(input.term, input.now, quote);

  const candidates: PromotionCandidate[] = [];
  if (membershipIneligibleReason === null) {
    candidates.push({ kind: "membership", discountMinor: quote.discountMinor });
  }
  for (const promotion of input.otherPromotions ?? []) {
    if (promotion.discountMinor > 0) {
      candidates.push({
        kind: "promotion",
        id: promotion.id,
        label: promotion.label,
        discountMinor: promotion.discountMinor,
      });
    }
  }

  return {
    membershipIneligibleReason,
    quote,
    choice: chooseBestPromotion(candidates),
    candidates,
  };
}

/** Picks the largest saving. Candidates are ordered so that the membership discount wins a tie. */
export function chooseBestPromotion(candidates: readonly PromotionCandidate[]): PromotionChoice {
  let best: PromotionChoice = { kind: "none", discountMinor: 0 };
  for (const candidate of candidates) {
    if (candidate.discountMinor > best.discountMinor) best = candidate;
  }
  return best;
}
