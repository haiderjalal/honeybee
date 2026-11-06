import { describe, expect, it } from "vitest";

import { MEMBERSHIP } from "@/constants/membership";
import { decideActivation, decidePurchaseStart } from "@/services/membership/membershipActivation";
import { getMembershipSalesBlockers, isMembershipSalesOpen } from "@/services/membership/membershipSalesGate";

import type { MembershipPurchaseState, MembershipTerm, VerifiedPaymentEvent } from "@/types/membership";

const verifiedAt = new Date("2026-11-06T10:00:00Z");

const openPurchase = (overrides: Partial<MembershipPurchaseState> = {}): MembershipPurchaseState => ({
  id: "purchase-1",
  status: "pending_verification",
  purpose: "new",
  termId: null,
  ...overrides,
});

const payment = (overrides: Partial<VerifiedPaymentEvent> = {}): VerifiedPaymentEvent => ({
  providerReference: "PAY-0001",
  amountMinor: MEMBERSHIP.feeMinor,
  verified: true,
  verifiedAt,
  ...overrides,
});

const term = (overrides: Partial<MembershipTerm> = {}): MembershipTerm => ({
  id: "term-1",
  status: "active",
  startsAt: new Date("2025-11-06T10:00:00Z"),
  expiresAt: new Date("2026-11-06T10:00:00Z"),
  discountAllowance: 6,
  discountsUsed: 6,
  discountsReserved: 0,
  ...overrides,
});

describe("decideActivation", () => {
  it("activates a new term for a verified fee payment, starting at verification and lasting 12 months", () => {
    const decision = decideActivation({ purchase: openPurchase(), payment: payment(), customerTerm: null });
    expect(decision).toEqual({
      action: "activate",
      startsAt: verifiedAt,
      expiresAt: new Date("2027-11-06T10:00:00Z"),
    });
  });

  it("never activates from an unverified payment, such as a browser success redirect or a screenshot", () => {
    const decision = decideActivation({
      purchase: openPurchase(),
      payment: payment({ verified: false }),
      customerTerm: null,
    });
    expect(decision).toEqual({ action: "reject", reason: "not_verified" });
  });

  it("treats a repeated callback for an activated purchase as a no-op that returns the existing term", () => {
    const decision = decideActivation({
      purchase: openPurchase({ status: "verified", termId: "term-9" }),
      payment: payment(),
      customerTerm: null,
    });
    expect(decision).toEqual({ action: "already_activated", termId: "term-9" });
  });

  it("does not activate a purchase that has failed or been cancelled", () => {
    for (const status of ["failed", "cancelled"] as const) {
      expect(decideActivation({ purchase: openPurchase({ status }), payment: payment(), customerTerm: null })).toEqual({
        action: "reject",
        reason: "purchase_closed",
      });
    }
  });

  it("rejects a payment whose amount does not match the fee", () => {
    const decision = decideActivation({
      purchase: openPurchase(),
      payment: payment({ amountMinor: MEMBERSHIP.feeMinor - 100 }),
      customerTerm: null,
    });
    expect(decision).toEqual({ action: "reject", reason: "amount_mismatch" });
  });

  it("does not create a second term while the verified phone already has an active one", () => {
    const active = term({ expiresAt: new Date("2027-06-01T00:00:00Z"), discountsUsed: 0 });
    const decision = decideActivation({
      purchase: openPurchase({ purpose: "new" }),
      payment: payment(),
      customerTerm: active,
    });
    expect(decision).toEqual({ action: "reject", reason: "already_member" });
  });

  it("allows renewal once the previous term has expired at its exact end instant", () => {
    const expired = term({ expiresAt: verifiedAt });
    const decision = decideActivation({
      purchase: openPurchase({ purpose: "renewal" }),
      payment: payment(),
      customerTerm: expired,
    });
    expect(decision).toMatchObject({ action: "activate", startsAt: verifiedAt });
  });

  it("blocks activation on a suspended or cancelled membership", () => {
    for (const status of ["suspended", "cancelled"] as const) {
      expect(
        decideActivation({
          purchase: openPurchase({ purpose: "renewal" }),
          payment: payment(),
          customerTerm: term({ status, expiresAt: verifiedAt }),
        }),
      ).toEqual({ action: "reject", reason: "membership_blocked" });
    }
  });
});

describe("decidePurchaseStart", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("offers a new membership to a customer who has never held a term", () => {
    expect(decidePurchaseStart({ customerTerm: null, hasOpenPurchase: false, now })).toEqual({
      ok: true,
      purpose: "new",
    });
  });

  it("blocks a second purchase while one is awaiting verification", () => {
    expect(decidePurchaseStart({ customerTerm: null, hasOpenPurchase: true, now })).toEqual({
      ok: false,
      reason: "purchase_open",
    });
  });

  it("prevents an active member from buying again", () => {
    const active = term({ expiresAt: new Date("2027-06-01T00:00:00Z"), discountsUsed: 0 });
    expect(decidePurchaseStart({ customerTerm: active, hasOpenPurchase: false, now })).toEqual({
      ok: false,
      reason: "already_active",
    });
  });

  it("offers renewal, not a new membership, once the term has expired", () => {
    const expired = term({ expiresAt: new Date("2026-05-01T00:00:00Z") });
    expect(decidePurchaseStart({ customerTerm: expired, hasOpenPurchase: false, now })).toEqual({
      ok: true,
      purpose: "renewal",
    });
  });

  it("offers renewal at the exact expiry instant", () => {
    const expiry = new Date("2027-06-01T00:00:00Z");
    const ended = term({ expiresAt: expiry });
    expect(decidePurchaseStart({ customerTerm: ended, hasOpenPurchase: false, now: expiry })).toEqual({
      ok: true,
      purpose: "renewal",
    });
  });
});

describe("membership sales gate", () => {
  it("keeps public sales closed and lists every open requirement while nothing is set up", () => {
    const closed = {
      refundPolicy: null,
      bankTransfer: null,
      adminVerificationAvailable: false,
      storageConfigured: false,
    };
    expect(isMembershipSalesOpen(closed)).toBe(false);
    expect(getMembershipSalesBlockers(closed)).toHaveLength(4);
  });

  it("opens sales only when every requirement is complete", () => {
    const complete = {
      refundPolicy: "Fees are refunded in full if we cancel the membership.",
      bankTransfer: {
        method: "Easypaisa",
        accountTitle: "HonyB",
        accountNumber: "03001234567",
        iban: null,
      },
      adminVerificationAvailable: true,
      storageConfigured: true,
    };
    expect(isMembershipSalesOpen(complete)).toBe(true);
    expect(getMembershipSalesBlockers({ ...complete, refundPolicy: null })).toHaveLength(1);
  });

  it("keeps sales closed while any bank detail is blank", () => {
    const incomplete = {
      refundPolicy: "Policy text",
      bankTransfer: { method: "Easypaisa", accountTitle: "HonyB", accountNumber: "", iban: null },
      adminVerificationAvailable: true,
      storageConfigured: true,
    };
    expect(isMembershipSalesOpen(incomplete)).toBe(false);
    expect(getMembershipSalesBlockers(incomplete)).toEqual([
      "Bank transfer details for membership fees have not been confirmed.",
    ]);
  });
});
