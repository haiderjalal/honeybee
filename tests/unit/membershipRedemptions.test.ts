import { describe, expect, it } from "vitest";

import {
  applyRedemptionEvent,
  calculateRefund,
  getActualSavingsMinor,
  getRemainingDiscountAllowance,
  reserveRedemption,
} from "@/services/membership/membershipRedemptions";

import type { RedemptionCounts, RefundableLine } from "@/types/membership";

const fresh: RedemptionCounts = { allowance: 6, used: 0, reserved: 0 };

/** Reserves one redemption and returns the new change, failing the test if the allowance is exhausted. */
function reserve(counts: RedemptionCounts) {
  const change = reserveRedemption(counts);
  if (!change) throw new Error("expected a reservation");
  return change;
}

describe("six-use limit", () => {
  it("allows exactly six reservations on a term", () => {
    let counts = fresh;
    for (let i = 0; i < 6; i += 1) {
      const change = reserveRedemption(counts);
      expect(change).not.toBeNull();
      counts = change!.counts;
    }
    expect(getRemainingDiscountAllowance(counts)).toBe(0);
    expect(reserveRedemption(counts)).toBeNull();
  });

  it("counts reserved and consumed redemptions together", () => {
    const consumed = applyRedemptionEvent(reserve({ ...fresh, used: 3 }), "consume");
    expect(consumed?.counts).toEqual({ allowance: 6, used: 4, reserved: 0 });
    expect(reserveRedemption({ allowance: 6, used: 4, reserved: 2 })).toBeNull();
  });

  it("returns a released reservation to the allowance", () => {
    const released = applyRedemptionEvent(reserve(fresh), "release");
    expect(released?.counts).toEqual(fresh);
    expect(getRemainingDiscountAllowance(released!.counts)).toBe(6);
  });
});

describe("redemption lifecycle", () => {
  it("moves a reservation to consumed when the order is fulfilled", () => {
    const change = applyRedemptionEvent(reserve(fresh), "consume");
    expect(change).toEqual({ status: "consumed", counts: { allowance: 6, used: 1, reserved: 0 } });
  });

  it("releases a reservation for a failed payment, expired order or cancellation", () => {
    const change = applyRedemptionEvent(reserve(fresh), "release");
    expect(change).toEqual({ status: "released", counts: { allowance: 6, used: 0, reserved: 0 } });
  });

  it("refuses duplicate or out-of-order events so counters never drift", () => {
    const released = applyRedemptionEvent(reserve(fresh), "release")!;
    expect(applyRedemptionEvent(released, "release")).toBeNull();
    expect(applyRedemptionEvent(released, "consume")).toBeNull();

    const consumed = applyRedemptionEvent(reserve(fresh), "consume")!;
    expect(applyRedemptionEvent(consumed, "consume")).toBeNull();
    expect(applyRedemptionEvent(consumed, "release")).toBeNull();
  });

  it("restores a consumed benefit on a full refund, without changing the term's allowance", () => {
    const consumed = applyRedemptionEvent(reserve(fresh), "consume")!;
    const restored = applyRedemptionEvent(consumed, "restore");
    expect(restored).toEqual({ status: "restored", counts: { allowance: 6, used: 0, reserved: 0 } });
  });

  it("does not restore a reservation that was never fulfilled", () => {
    expect(applyRedemptionEvent(reserve(fresh), "restore")).toBeNull();
  });
});

describe("refund calculations", () => {
  const line: RefundableLine = {
    lineId: "jar",
    quantity: 3,
    refundedQuantity: 0,
    lineTotalMinor: 1_050_000,
    discountMinor: 105_000 - 3, // deliberately uneven so the share rounding is exercised
  };

  it("returns the amount actually paid for returned items and reverses their discount share", () => {
    const result = calculateRefund([line], [{ lineId: "jar", quantity: 1 }]);
    expect(result).toMatchObject({ ok: true, isFullRefund: false });
    if (!result.ok) return;
    // Paid on the line is total minus discount; one of three jars returns a third of that, rounded down.
    const paid = line.lineTotalMinor - line.discountMinor;
    expect(result.refundedPaidMinor).toBe(Math.floor(paid / 3));
    expect(result.reversedDiscountMinor).toBe(Math.floor(line.discountMinor / 3));
  });

  it("adds up exactly across several partial refunds of the same line", () => {
    const first = calculateRefund([line], [{ lineId: "jar", quantity: 1 }]);
    const second = calculateRefund([{ ...line, refundedQuantity: 1 }], [{ lineId: "jar", quantity: 1 }]);
    const third = calculateRefund([{ ...line, refundedQuantity: 2 }], [{ lineId: "jar", quantity: 1 }]);
    if (!first.ok || !second.ok || !third.ok) throw new Error("expected valid refunds");

    const paid = line.lineTotalMinor - line.discountMinor;
    expect(first.refundedPaidMinor + second.refundedPaidMinor + third.refundedPaidMinor).toBe(paid);
    expect(first.reversedDiscountMinor + second.reversedDiscountMinor + third.reversedDiscountMinor).toBe(
      line.discountMinor,
    );
    expect(third.isFullRefund).toBe(true);
  });

  it("marks a single request covering every unit as a full refund", () => {
    const result = calculateRefund([line], [{ lineId: "jar", quantity: 3 }]);
    expect(result).toMatchObject({
      ok: true,
      isFullRefund: true,
      refundedPaidMinor: line.lineTotalMinor - line.discountMinor,
      reversedDiscountMinor: line.discountMinor,
    });
  });

  it("is only a full refund when every line is fully returned", () => {
    const lines: RefundableLine[] = [
      { lineId: "a", quantity: 1, refundedQuantity: 0, lineTotalMinor: 300_000, discountMinor: 30_000 },
      { lineId: "b", quantity: 1, refundedQuantity: 0, lineTotalMinor: 100_000, discountMinor: 0 },
    ];
    expect(calculateRefund(lines, [{ lineId: "a", quantity: 1 }])).toMatchObject({ ok: true, isFullRefund: false });
    expect(
      calculateRefund(lines, [
        { lineId: "a", quantity: 1 },
        { lineId: "b", quantity: 1 },
      ]),
    ).toMatchObject({ ok: true, isFullRefund: true });
  });

  it("rejects a refund larger than the units still unrefunded", () => {
    expect(calculateRefund([{ ...line, refundedQuantity: 2 }], [{ lineId: "jar", quantity: 2 }])).toEqual({
      ok: false,
      reason: "invalid_quantity",
    });
  });

  it("rejects a line that is not on the order", () => {
    expect(calculateRefund([line], [{ lineId: "missing", quantity: 1 }])).toEqual({
      ok: false,
      reason: "unknown_line",
    });
  });

  it("rejects a line requested twice in one request", () => {
    expect(
      calculateRefund(
        [line],
        [
          { lineId: "jar", quantity: 1 },
          { lineId: "jar", quantity: 1 },
        ],
      ),
    ).toEqual({ ok: false, reason: "invalid_quantity" });
  });
});

describe("actual savings", () => {
  it("counts nothing for reserved, released or unpaid orders", () => {
    expect(getActualSavingsMinor({ status: "reserved", discountMinor: 30_000, reversedDiscountMinor: 0 })).toBe(0);
    expect(getActualSavingsMinor({ status: "released", discountMinor: 30_000, reversedDiscountMinor: 0 })).toBe(0);
  });

  it("counts a fulfilled order's discount", () => {
    expect(getActualSavingsMinor({ status: "consumed", discountMinor: 34_990, reversedDiscountMinor: 0 })).toBe(34_990);
  });

  it("reduces savings by the discount share returned in a partial refund, keeping the benefit used", () => {
    expect(getActualSavingsMinor({ status: "consumed", discountMinor: 34_990, reversedDiscountMinor: 11_663 })).toBe(
      23_327,
    );
  });

  it("removes all savings once an order is fully refunded and its benefit restored", () => {
    expect(getActualSavingsMinor({ status: "restored", discountMinor: 34_990, reversedDiscountMinor: 34_990 })).toBe(0);
  });
});
