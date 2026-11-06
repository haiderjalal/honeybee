// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MEMBERSHIP } from "@/constants/membership";
import { createOrderMembershipPort } from "@/services/membership/membershipOrderPort";
import { MembershipRepository } from "@/services/membership/membership.repository";
import {
  fulfilMemberOrder,
  quoteMemberDiscount,
  refundMemberOrder,
  startFeePurchase,
  submitPaymentReference,
  verifyFeePayment,
} from "@/services/membership/membership.service";
import { dispatchRenewalReminders, type RenewalReminderTransport } from "@/services/membership/membershipReminders";
import { addCalendarMonths } from "@/services/membership/membershipTerms";

import { createMembershipTestDatabase, type MembershipTestDatabase } from "../fakes/membershipDatabase";

import type { OrderLine } from "@/services/inquiry.types";

/** The order flow end to end: service and port over the real migration in embedded Postgres. */

/** Embedded Postgres starts in a few seconds, and several test files start it at once. */
const DATABASE_HOOK_TIMEOUT_MS = 60_000;

const NOW = new Date("2026-11-06T10:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

let db: MembershipTestDatabase;
let repo: MembershipRepository;
let phoneCounter = 0;
const nextPhone = (): string => `03${String(200_000_000 + ++phoneCounter)}`;

beforeAll(async () => {
  db = await createMembershipTestDatabase();
  repo = new MembershipRepository(db.rpc);
}, DATABASE_HOOK_TIMEOUT_MS);

afterAll(async () => {
  await db.close();
}, DATABASE_HOOK_TIMEOUT_MS);

/** A Sidr 500 g jar is Rs 1,970 at regular price, so two jars clear the Rs 3,000 minimum. */
function sidrLine(quantity: number): OrderLine {
  return {
    varietySlug: "sidr-honey",
    sizeId: "500g",
    name: "Sidr Honey",
    sizeLabel: "500 g",
    quantity,
    unitPrice: 1970,
    lineTotal: 1970 * quantity,
  };
}

/** Sidr 1 kg is on sale (list Rs 3,999, now Rs 3,699), so membership does not apply to it. */
function saleLine(): OrderLine {
  return {
    varietySlug: "sidr-honey",
    sizeId: "1kg",
    name: "Sidr Honey",
    sizeLabel: "1 kg",
    quantity: 1,
    unitPrice: 3699,
    lineTotal: 3699,
  };
}

/**
 * Creates a verified member directly. Public purchases stay closed until the launch gate opens, so the helper opens
 * the purchase through the repository and verifies it through the real verification service.
 */
async function activateMember(activatedAt: Date = NOW): Promise<string> {
  const userId = await db.createUser();
  const phone = nextPhone();
  const purchase = await repo.createPurchase({
    userId,
    phone,
    purpose: "new",
    amountMinor: MEMBERSHIP.feeMinor,
  });
  await submitPaymentReference(repo, { userId, purchaseId: purchase.id, reference: "customer-claim-1" });
  await verifyFeePayment(repo, {
    purchaseId: purchase.id,
    providerReference: `BANK-${phone}`,
    actor: "admin@honeyb.test",
    now: activatedAt,
  });
  return userId;
}

describe("public purchase gate", () => {
  it("refuses public fee purchases while sales are closed", async () => {
    await expect(
      startFeePurchase(repo, { userId: await db.createUser(), phone: "0300 1234567", now: NOW }),
    ).rejects.toThrow("membership: sales_closed");
  });
});

describe("member discount at order creation", () => {
  it("reserves the discount for an eligible basket and returns it to the order", async () => {
    const userId = await activateMember();
    const port = createOrderMembershipPort(repo);

    const reservation = await port.reserve({
      customerUserId: userId,
      orderReference: "HB-FLOW-1",
      lines: [sidrLine(2)],
      now: NOW,
    });

    // 2 × Rs 1,970 = Rs 3,940. Ten percent would be Rs 394, which is capped at Rs 350 per order.
    expect(reservation).toEqual({ discountMinor: MEMBERSHIP.maxDiscountPerOrderMinor });
    const snapshot = await repo.getAccountSnapshot(userId);
    expect(snapshot.redemptions).toEqual([
      expect.objectContaining({
        orderReference: "HB-FLOW-1",
        status: "reserved",
        discountMinor: MEMBERSHIP.maxDiscountPerOrderMinor,
      }),
    ]);
  });

  it("previews the discount without reserving anything", async () => {
    const userId = await activateMember();
    const quote = await quoteMemberDiscount(repo, {
      customerUserId: userId,
      lines: [{ lineKey: "sidr-honey:500g", quantity: 2, lineTotalMinor: 394_000, onSale: false }],
      now: NOW,
    });

    expect(quote).toMatchObject({ signedIn: true, applied: true, discountMinor: MEMBERSHIP.maxDiscountPerOrderMinor });
    expect((await repo.getAccountSnapshot(userId)).redemptions).toEqual([]);
  });

  it("does not reserve anything for a basket made only of sale jars", async () => {
    const userId = await activateMember();
    const port = createOrderMembershipPort(repo);

    const reservation = await port.reserve({
      customerUserId: userId,
      orderReference: "HB-FLOW-SALE",
      lines: [saleLine()],
      now: NOW,
    });

    expect(reservation).toBeNull();
    expect((await repo.getAccountSnapshot(userId)).redemptions).toEqual([]);
  });

  it("returns null, not an error, for a customer with no membership", async () => {
    const port = createOrderMembershipPort(repo);
    const reservation = await port.reserve({
      customerUserId: await db.createUser(),
      orderReference: "HB-FLOW-NONE",
      lines: [sidrLine(2)],
      now: NOW,
    });
    expect(reservation).toBeNull();
  });

  it("releases a reservation once and ignores repeated releases", async () => {
    const userId = await activateMember();
    const port = createOrderMembershipPort(repo);
    await port.reserve({ customerUserId: userId, orderReference: "HB-FLOW-REL", lines: [sidrLine(2)], now: NOW });

    await port.release("HB-FLOW-REL");
    await port.release("HB-FLOW-REL");

    const [redemption] = (await repo.getAccountSnapshot(userId)).redemptions;
    expect(redemption.status).toBe("released");
    const term = (await repo.getAccountSnapshot(userId)).terms[0];
    expect(term.discountsReserved).toBe(0);
  });

  it("does not count a repeated reservation for the same order twice", async () => {
    const userId = await activateMember();
    const port = createOrderMembershipPort(repo);

    await port.reserve({ customerUserId: userId, orderReference: "HB-FLOW-DUP", lines: [sidrLine(2)], now: NOW });
    await port.reserve({ customerUserId: userId, orderReference: "HB-FLOW-DUP", lines: [sidrLine(2)], now: NOW });

    expect((await repo.getAccountSnapshot(userId)).terms[0].discountsReserved).toBe(1);
  });

  it("stops at six discounted orders and prices the seventh at regular prices instead of failing", async () => {
    const userId = await activateMember();
    const port = createOrderMembershipPort(repo);

    for (let index = 1; index <= MEMBERSHIP.discountAllowance; index += 1) {
      const reservation = await port.reserve({
        customerUserId: userId,
        orderReference: `HB-FLOW-SIX-${index}`,
        lines: [sidrLine(2)],
        now: NOW,
      });
      expect(reservation).not.toBeNull();
    }

    const seventh = await port.reserve({
      customerUserId: userId,
      orderReference: "HB-FLOW-SIX-7",
      lines: [sidrLine(2)],
      now: NOW,
    });
    expect(seventh).toBeNull();
    expect((await repo.getAccountSnapshot(userId)).terms[0].discountsReserved).toBe(6);
  });
});

describe("fulfilment and refunds through the service", () => {
  it("consumes on fulfilment, refunds part of an order, and restores the benefit on the final refund without extending the term", async () => {
    const userId = await activateMember();
    const port = createOrderMembershipPort(repo);
    await port.reserve({ customerUserId: userId, orderReference: "HB-FLOW-REF", lines: [sidrLine(2)], now: NOW });
    const termBefore = (await repo.getAccountSnapshot(userId)).terms[0];

    expect(
      await fulfilMemberOrder(repo, "HB-FLOW-REF", { actor: "admin@honeyb.test", reason: "Test fulfilment" }),
    ).toBe("consumed");
    const partial = await refundMemberOrder(repo, {
      orderReference: "HB-FLOW-REF",
      refund: [{ lineKey: "sidr-honey:500g", quantity: 1 }],
      audit: { actor: "admin@honeyb.test", reason: "Test fulfilment" },
    });
    expect(partial).toMatchObject({ status: "consumed", isFullRefund: false });
    expect(partial.refundedPaidMinor).toBeGreaterThan(0);

    const full = await refundMemberOrder(repo, {
      orderReference: "HB-FLOW-REF",
      refund: [{ lineKey: "sidr-honey:500g", quantity: 1 }],
      audit: { actor: "admin@honeyb.test", reason: "Test fulfilment" },
    });
    expect(full).toMatchObject({ status: "restored", isFullRefund: true });

    const termAfter = (await repo.getAccountSnapshot(userId)).terms[0];
    expect(termAfter.discountsUsed).toBe(0);
    expect(termAfter.expiresAt.toISOString()).toBe(termBefore.expiresAt.toISOString());
  });

  it("refuses a refund on an order that was never fulfilled", async () => {
    const userId = await activateMember();
    const port = createOrderMembershipPort(repo);
    await port.reserve({ customerUserId: userId, orderReference: "HB-FLOW-UNF", lines: [sidrLine(2)], now: NOW });

    await expect(
      refundMemberOrder(repo, {
        orderReference: "HB-FLOW-UNF",
        refund: [{ lineKey: "sidr-honey:500g", quantity: 1 }],
        audit: { actor: "admin@honeyb.test", reason: "Test fulfilment" },
      }),
    ).rejects.toThrow("membership: not_fulfilled");
  });
});

describe("renewal reminders", () => {
  /** A term that ends six days after NOW, so the 7-day reminder is due. */
  async function memberEndingInSixDays(): Promise<{
    userId: string;
    terms: Awaited<ReturnType<MembershipRepository["getAccountSnapshot"]>>["terms"];
  }> {
    const expiry = new Date(NOW.getTime() + 6 * DAY_MS);
    const userId = await activateMember(addCalendarMonths(expiry, -MEMBERSHIP.termMonths));
    // Sanity check: the term really ends six days after NOW.
    expect((await repo.getAccountSnapshot(userId)).terms[0].expiresAt.getTime()).toBe(expiry.getTime());
    const snapshot = await repo.getAccountSnapshot(userId);
    return { userId, terms: snapshot.terms };
  }

  function recordingTransport(configured = true) {
    const sent: string[] = [];
    const transport: RenewalReminderTransport = {
      configured,
      async sendRenewalReminder({ customerUserId }) {
        sent.push(customerUserId);
      },
    };
    return { sent, transport };
  }

  it("sends one reminder per term, even when the scheduler runs twice", async () => {
    const { userId, terms } = await memberEndingInSixDays();
    const { sent, transport } = recordingTransport();
    const enabled = async () => true;

    const first = await dispatchRenewalReminders({
      repo,
      transport,
      terms,
      isRenewalReminderEnabled: enabled,
      now: NOW,
    });
    const second = await dispatchRenewalReminders({
      repo,
      transport,
      terms,
      isRenewalReminderEnabled: enabled,
      now: NOW,
    });

    expect(first.sent).toBe(1);
    expect(second).toMatchObject({ sent: 0, skippedAlreadyClaimed: 1 });
    expect(sent).toEqual([userId]);
  });

  it("sends nothing to customers who have not consented", async () => {
    const { terms } = await memberEndingInSixDays();
    const { sent, transport } = recordingTransport();

    const result = await dispatchRenewalReminders({
      repo,
      transport,
      terms,
      isRenewalReminderEnabled: async () => false,
      now: NOW,
    });

    expect(result.sent).toBe(0);
    expect(sent).toEqual([]);
  });

  it("claims nothing while no messaging channel is configured", async () => {
    const { userId, terms } = await memberEndingInSixDays();
    const { sent, transport } = recordingTransport(false);

    const result = await dispatchRenewalReminders({
      repo,
      transport,
      terms,
      isRenewalReminderEnabled: async () => true,
      now: NOW,
    });

    expect(result).toMatchObject({ sent: 0, channelNotConfigured: true });
    expect(sent).toEqual([]);

    // Once a channel exists, the reminder is still due and is sent.
    const later = recordingTransport(true);
    const retry = await dispatchRenewalReminders({
      repo,
      transport: later.transport,
      terms,
      isRenewalReminderEnabled: async () => true,
      now: NOW,
    });
    expect(retry.sent).toBe(1);
    expect(later.sent).toEqual([userId]);
  });
});
