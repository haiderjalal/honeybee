import { describe, expect, it } from "vitest";

import {
  decideMemberOrder,
  allocateProportionally,
  quoteMembershipDiscount,
} from "@/services/membership/membershipDiscount";

import type { DiscountLine, MembershipTerm, PromotionOption } from "@/types/membership";

const honey = (id: string, lineTotalMinor: number, onSale = false): DiscountLine => ({
  id,
  kind: "honey",
  lineTotalMinor,
  onSale,
});

const activeTerm = (overrides: Partial<MembershipTerm> = {}): MembershipTerm => ({
  id: "term-1",
  status: "active",
  startsAt: new Date("2026-11-06T10:00:00Z"),
  expiresAt: new Date("2027-11-06T10:00:00Z"),
  discountAllowance: 6,
  discountsUsed: 0,
  discountsReserved: 0,
  ...overrides,
});

const now = new Date("2026-12-01T00:00:00Z");

describe("quoteMembershipDiscount", () => {
  it("gives 10% of the eligible honey subtotal, the example in the brief (PKR 3,499 saves PKR 349.90)", () => {
    const quote = quoteMembershipDiscount([honey("jar", 349_900)]);
    expect(quote.discountMinor).toBe(34_990);
    expect(quote.capped).toBe(false);
  });

  it("applies at exactly the minimum eligible subtotal of PKR 3,000", () => {
    const quote = quoteMembershipDiscount([honey("jar", 300_000)]);
    expect(quote.meetsMinimum).toBe(true);
    expect(quote.discountMinor).toBe(30_000);
  });

  it("does not apply one paisa below the PKR 3,000 minimum", () => {
    const quote = quoteMembershipDiscount([honey("jar", 299_999)]);
    expect(quote.meetsMinimum).toBe(false);
    expect(quote.discountMinor).toBe(0);
    expect(quote.allocations).toEqual([{ lineId: "jar", discountMinor: 0 }]);
  });

  it("caps the discount at PKR 350 per order", () => {
    const quote = quoteMembershipDiscount([honey("big", 500_000)]);
    expect(quote.uncappedDiscountMinor).toBe(50_000);
    expect(quote.discountMinor).toBe(35_000);
    expect(quote.capped).toBe(true);
  });

  it("rounds half up to the nearest paisa", () => {
    // 10% of 300.505 rupees is 30.0505 rupees: half of a paisa rounds up.
    expect(quoteMembershipDiscount([honey("jar", 300_505)]).discountMinor).toBe(30_051);
    // 10% of 300.504 rupees is 30.0504 rupees: rounds down.
    expect(quoteMembershipDiscount([honey("jar", 300_504)]).discountMinor).toBe(30_050);
  });

  it("excludes sale jars, delivery, membership fees, gift cards and non-honey items", () => {
    const lines: DiscountLine[] = [
      honey("regular", 300_000),
      honey("sale", 369_900, true),
      { id: "delivery", kind: "delivery", lineTotalMinor: 25_000, onSale: false },
      { id: "fee", kind: "membership_fee", lineTotalMinor: 99_900, onSale: false },
      { id: "card", kind: "gift_card", lineTotalMinor: 50_000, onSale: false },
      { id: "other", kind: "non_honey", lineTotalMinor: 80_000, onSale: false },
    ];
    const quote = quoteMembershipDiscount(lines);
    expect(quote.eligibleLineIds).toEqual(["regular"]);
    expect(quote.eligibleSubtotalMinor).toBe(300_000);
    expect(quote.discountMinor).toBe(30_000);
  });

  it("lists every line in the allocation, with zero for lines that do not qualify", () => {
    const quote = quoteMembershipDiscount([honey("a", 200_000), honey("sale", 100_000, true)]);
    expect(quote.allocations).toEqual([
      { lineId: "a", discountMinor: 0 },
      { lineId: "sale", discountMinor: 0 },
    ]);
  });
});

describe("allocateProportionally", () => {
  it("always sums to the total, giving leftover minor units to the largest remainders", () => {
    const shares = allocateProportionally(10, [
      { id: "a", weight: 1 },
      { id: "b", weight: 1 },
      { id: "c", weight: 1 },
    ]);
    expect([...shares.values()]).toEqual([4, 3, 3]);
    expect([...shares.values()].reduce((sum, value) => sum + value, 0)).toBe(10);
  });

  it("splits a discount across uneven lines without losing a paisa", () => {
    const parts = [
      { id: "a", weight: 333_333 },
      { id: "b", weight: 333_333 },
      { id: "c", weight: 333_334 },
    ];
    const shares = allocateProportionally(34_990, parts);
    const total = [...shares.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBe(34_990);
  });

  it("returns zero shares when nothing has weight", () => {
    expect(allocateProportionally(0, [{ id: "a", weight: 0 }]).get("a")).toBe(0);
  });
});

describe("decideMemberOrder", () => {
  it("applies the membership discount for an active member with an eligible basket", () => {
    const decision = decideMemberOrder({ term: activeTerm(), now, lines: [honey("jar", 300_000)] });
    expect(decision.membershipIneligibleReason).toBeNull();
    expect(decision.choice).toEqual({ kind: "membership", discountMinor: 30_000 });
  });

  it("explains a missing membership without changing the basket price", () => {
    const decision = decideMemberOrder({ term: null, now, lines: [honey("jar", 300_000)] });
    expect(decision.membershipIneligibleReason).toBe("no_membership");
    expect(decision.choice).toEqual({ kind: "none", discountMinor: 0 });
  });

  it("refuses the discount on an expired term", () => {
    const decision = decideMemberOrder({
      term: activeTerm(),
      now: new Date("2027-11-06T10:00:00Z"),
      lines: [honey("jar", 300_000)],
    });
    expect(decision.membershipIneligibleReason).toBe("term_not_active");
  });

  it("refuses the discount once all six allowances are committed", () => {
    const decision = decideMemberOrder({
      term: activeTerm({ discountsUsed: 4, discountsReserved: 2 }),
      now,
      lines: [honey("jar", 300_000)],
    });
    expect(decision.membershipIneligibleReason).toBe("allowance_used");
  });

  it("explains when only sale jars are in the basket", () => {
    const decision = decideMemberOrder({ term: activeTerm(), now, lines: [honey("sale", 369_900, true)] });
    expect(decision.membershipIneligibleReason).toBe("no_eligible_items");
  });

  it("explains when the eligible subtotal is below the minimum", () => {
    const decision = decideMemberOrder({ term: activeTerm(), now, lines: [honey("small", 200_000)] });
    expect(decision.membershipIneligibleReason).toBe("below_minimum");
    expect(decision.choice.discountMinor).toBe(0);
  });

  it("chooses a larger other promotion over the membership discount, and says so", () => {
    const coupon: PromotionOption = { id: "coupon-500", label: "Rs 500 off", discountMinor: 50_000 };
    const decision = decideMemberOrder({
      term: activeTerm(),
      now,
      lines: [honey("jar", 300_000)],
      otherPromotions: [coupon],
    });
    expect(decision.choice).toEqual({
      kind: "promotion",
      id: "coupon-500",
      label: "Rs 500 off",
      discountMinor: 50_000,
    });
    expect(decision.candidates).toHaveLength(2);
  });

  it("keeps the membership discount when another promotion saves less", () => {
    const coupon: PromotionOption = { id: "coupon-100", label: "Rs 100 off", discountMinor: 10_000 };
    const decision = decideMemberOrder({
      term: activeTerm(),
      now,
      lines: [honey("jar", 300_000)],
      otherPromotions: [coupon],
    });
    expect(decision.choice).toEqual({ kind: "membership", discountMinor: 30_000 });
  });

  it("gives the membership discount the win on a tie", () => {
    const coupon: PromotionOption = { id: "coupon-300", label: "Rs 300 off", discountMinor: 30_000 };
    const decision = decideMemberOrder({
      term: activeTerm(),
      now,
      lines: [honey("jar", 300_000)],
      otherPromotions: [coupon],
    });
    expect(decision.choice.kind).toBe("membership");
  });

  it("uses the other promotion when membership is not available", () => {
    const coupon: PromotionOption = { id: "coupon-200", label: "Rs 200 off", discountMinor: 20_000 };
    const decision = decideMemberOrder({
      term: null,
      now,
      lines: [honey("small", 100_000)],
      otherPromotions: [coupon],
    });
    expect(decision.choice).toEqual({
      kind: "promotion",
      id: "coupon-200",
      label: "Rs 200 off",
      discountMinor: 20_000,
    });
  });
});
