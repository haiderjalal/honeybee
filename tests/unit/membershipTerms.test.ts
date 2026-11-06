import { describe, expect, it } from "vitest";

import {
  addCalendarMonths,
  getMembershipDisplayStatus,
  getTermWindow,
  isWithinTerm,
} from "@/services/membership/membershipTerms";

import type { MembershipTerm } from "@/types/membership";

const term = (overrides: Partial<MembershipTerm> = {}): MembershipTerm => ({
  id: "term-1",
  status: "active",
  startsAt: new Date("2026-11-06T10:00:00Z"),
  expiresAt: new Date("2027-11-06T10:00:00Z"),
  discountAllowance: 6,
  discountsUsed: 0,
  discountsReserved: 0,
  ...overrides,
});

describe("addCalendarMonths", () => {
  it("keeps the same local wall-clock time a year later (Pakistan time, UTC+5)", () => {
    // 10:00 UTC is 15:00 in Pakistan; the expiry keeps 15:00 local, which is 10:00 UTC.
    expect(addCalendarMonths(new Date("2026-11-06T10:00:00Z"), 12).toISOString()).toBe("2027-11-06T10:00:00.000Z");
  });

  it("uses the Pakistan calendar day, not the UTC day, near midnight", () => {
    // 20:00 UTC on 31 Dec is 01:00 on 1 Jan in Pakistan, so a year later it expires on 1 Jan 2028 local time.
    expect(addCalendarMonths(new Date("2026-12-31T20:00:00Z"), 12).toISOString()).toBe("2027-12-31T20:00:00.000Z");
  });

  it("clamps 29 February to the last day of February in a non-leap year", () => {
    expect(addCalendarMonths(new Date("2028-02-29T10:00:00Z"), 12).toISOString()).toBe("2029-02-28T10:00:00.000Z");
  });
});

describe("isWithinTerm — expiry boundary", () => {
  const window = getTermWindow(new Date("2026-11-06T10:00:00Z"));

  it("grants the term from the activation instant", () => {
    expect(isWithinTerm(window, new Date("2026-11-06T10:00:00.000Z"))).toBe(true);
  });

  it("is still active one millisecond before expiry", () => {
    expect(isWithinTerm(window, new Date("2027-11-06T09:59:59.999Z"))).toBe(true);
  });

  it("is already expired at the exact expiry instant", () => {
    expect(isWithinTerm(window, new Date("2027-11-06T10:00:00.000Z"))).toBe(false);
  });

  it("is not active before activation", () => {
    expect(isWithinTerm(window, new Date("2026-11-06T09:59:59.999Z"))).toBe(false);
  });
});

describe("getMembershipDisplayStatus", () => {
  const now = new Date("2027-01-01T00:00:00Z");

  it("reports none when the customer has never held a term", () => {
    expect(getMembershipDisplayStatus(null, now)).toBe("none");
  });

  it("reports active inside the term", () => {
    expect(getMembershipDisplayStatus(term(), now)).toBe("active");
  });

  it("reports expired after the term ends", () => {
    expect(getMembershipDisplayStatus(term(), new Date("2027-11-06T10:00:00Z"))).toBe("expired");
  });

  it("reports pending while a fee purchase awaits verification and no current term exists", () => {
    expect(getMembershipDisplayStatus(term({ expiresAt: new Date("2025-01-01T00:00:00Z") }), now, true)).toBe(
      "pending_payment",
    );
  });

  it("reports suspended and cancelled ahead of dates", () => {
    expect(getMembershipDisplayStatus(term({ status: "suspended" }), now)).toBe("suspended");
    expect(getMembershipDisplayStatus(term({ status: "cancelled" }), now)).toBe("cancelled");
  });
});
