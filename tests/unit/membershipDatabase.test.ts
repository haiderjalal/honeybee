// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MEMBERSHIP } from "@/constants/membership";
import { getTermWindow } from "@/services/membership/membershipTerms";

import { createMembershipTestDatabase, type MembershipTestDatabase } from "../fakes/membershipDatabase";

/** Database invariants of the membership migration, run against embedded Postgres. */

/** Embedded Postgres starts in a few seconds, and several test files start it at once. */
const DATABASE_HOOK_TIMEOUT_MS = 60_000;

const NOW = new Date("2026-11-06T10:00:00Z");
const RULES = {
  fee_minor: MEMBERSHIP.feeMinor,
  discount_allowance: MEMBERSHIP.discountAllowance,
  discount_rate_bps: MEMBERSHIP.discountRateBps,
  max_discount_per_order_minor: MEMBERSHIP.maxDiscountPerOrderMinor,
  min_eligible_subtotal_minor: MEMBERSHIP.minEligibleSubtotalMinor,
};

let db: MembershipTestDatabase;
let phoneCounter = 0;

/** A unique, valid normalised Pakistani mobile number for each test customer. */
const nextPhone = (): string => `03${String(100_000_000 + ++phoneCounter)}`;

beforeAll(async () => {
  db = await createMembershipTestDatabase();
}, DATABASE_HOOK_TIMEOUT_MS);

afterAll(async () => {
  await db.close();
}, DATABASE_HOOK_TIMEOUT_MS);

interface PurchaseRow {
  id: string;
  status: string;
}

async function openPurchase(userId: string, phone: string): Promise<PurchaseRow> {
  return (await db.rpc("membership_create_purchase", {
    user_id: userId,
    phone,
    purpose: "new",
    amount_minor: MEMBERSHIP.feeMinor,
  })) as PurchaseRow;
}

async function verify(
  purchaseId: string,
  providerReference: string,
  options: { amountMinor?: number; now?: Date } = {},
) {
  const window = getTermWindow(options.now ?? NOW);
  return db.rpc("membership_verify_payment", {
    purchase_id: purchaseId,
    provider: "manual",
    provider_reference: providerReference,
    amount_minor: options.amountMinor ?? MEMBERSHIP.feeMinor,
    actor: "admin@honeyb.test",
    reason: "Matched bank statement",
    starts_at: window.startsAt.toISOString(),
    expires_at: window.expiresAt.toISOString(),
    ...RULES,
  }) as Promise<{ result: string; term_id: string }>;
}

/** Opens and verifies a purchase, returning the new term id. */
async function activate(userId: string, phone: string, reference: string, now = NOW): Promise<string> {
  const purchase = await openPurchase(userId, phone);
  const result = await verify(purchase.id, reference, { now });
  return result.term_id;
}

async function termRow(termId: string) {
  const [row] = await db.query<{
    discounts_used: number;
    discounts_reserved: number;
    expires_at: Date;
    status: string;
  }>("select discounts_used, discounts_reserved, expires_at, status from membership_terms where id = $1", [termId]);
  return row;
}

async function reserve(termId: string, orderReference: string, discountMinor = 30_000) {
  return db.rpc("membership_reserve_redemption", {
    term_id: termId,
    order_reference: orderReference,
    eligible_subtotal_minor: 300_000,
    discount_minor: discountMinor,
    lines: [{ line_key: "sidr-honey:1kg", quantity: 1, line_total_minor: 300_000, discount_minor: discountMinor }],
  });
}

interface ChangeOverrides {
  expected_status: string;
  new_status: string;
  used_delta?: number;
  reserved_delta?: number;
  expected_reversed_minor?: number;
  new_reversed_minor?: number;
  expected_refunded_minor?: number;
  new_refunded_minor?: number;
}

async function applyChange(orderReference: string, change: ChangeOverrides) {
  return db.rpc("membership_apply_redemption_change", {
    order_reference: orderReference,
    expected_status: change.expected_status,
    new_status: change.new_status,
    used_delta: change.used_delta ?? 0,
    reserved_delta: change.reserved_delta ?? 0,
    expected_reversed_minor: change.expected_reversed_minor ?? 0,
    new_reversed_minor: change.new_reversed_minor ?? 0,
    expected_refunded_minor: change.expected_refunded_minor ?? 0,
    new_refunded_minor: change.new_refunded_minor ?? 0,
    actor: "admin@honeyb.test",
    reason: "Test change",
    audit_action: "redemption.test",
  });
}

describe("activation", () => {
  it("activates a 12-month term for a verified payment and writes an audit record", async () => {
    const userId = await db.createUser();
    const phone = nextPhone();
    const purchase = await openPurchase(userId, phone);

    const result = await verify(purchase.id, "BANK-A-0001");

    expect(result.result).toBe("activated");
    const [term] = await db.query<{ starts_at: Date; expires_at: Date; status: string; phone: string }>(
      "select starts_at, expires_at, status, phone from membership_terms where id = $1",
      [result.term_id],
    );
    expect(term.status).toBe("active");
    expect(term.phone).toBe(phone);
    expect(term.expires_at.toISOString()).toBe("2027-11-06T10:00:00.000Z");

    const audit = await db.query("select action from membership_audit_events where entity_id = $1", [purchase.id]);
    expect(audit.map((row) => row.action)).toEqual(["payment.verified"]);
  });

  it("treats a repeated callback as already activated and never creates a second term", async () => {
    const userId = await db.createUser();
    const purchase = await openPurchase(userId, nextPhone());
    const first = await verify(purchase.id, "BANK-B-0001");

    const second = await verify(purchase.id, "BANK-B-0001");

    expect(second).toEqual({ result: "already_activated", term_id: first.term_id });
    const terms = await db.query("select id from membership_terms where customer_user_id = $1", [userId]);
    expect(terms).toHaveLength(1);
    const audit = await db.query("select id from membership_audit_events where entity_id = $1", [purchase.id]);
    expect(audit).toHaveLength(1);
  });

  it("refuses a bank reference that already verified another purchase", async () => {
    const first = await openPurchase(await db.createUser(), nextPhone());
    await verify(first.id, "BANK-C-0001");

    const second = await openPurchase(await db.createUser(), nextPhone());
    await expect(verify(second.id, "BANK-C-0001")).rejects.toThrow("membership: reference_already_used");

    const [row] = await db.query<{ status: string }>("select status from membership_payments where id = $1", [
      second.id,
    ]);
    expect(row.status).toBe("awaiting_payment");
  });

  it("rejects an amount that does not match the fee and leaves the purchase open", async () => {
    const purchase = await openPurchase(await db.createUser(), nextPhone());

    await expect(verify(purchase.id, "BANK-D-0001", { amountMinor: MEMBERSHIP.feeMinor - 100 })).rejects.toThrow(
      "membership: amount_mismatch",
    );
    const [row] = await db.query<{ status: string }>("select status from membership_payments where id = $1", [
      purchase.id,
    ]);
    expect(row.status).toBe("awaiting_payment");
  });

  it("allows one open purchase per account and one per phone number", async () => {
    const userId = await db.createUser();
    const phone = nextPhone();
    await openPurchase(userId, phone);

    await expect(openPurchase(userId, nextPhone())).rejects.toThrow("membership: purchase_open");
    await expect(openPurchase(await db.createUser(), phone)).rejects.toThrow("membership: purchase_open");
  });

  it("never creates a second overlapping term for the same account", async () => {
    const userId = await db.createUser();
    await activate(userId, nextPhone(), "BANK-E-0001");

    const again = await openPurchase(userId, nextPhone());
    await expect(verify(again.id, "BANK-E-0002")).rejects.toThrow("membership: already_member");
  });

  it("never creates an overlapping term for the same phone across two accounts", async () => {
    const phone = nextPhone();
    await activate(await db.createUser(), phone, "BANK-F-0001");

    const otherAccount = await openPurchase(await db.createUser(), phone);
    await expect(verify(otherAccount.id, "BANK-F-0002")).rejects.toThrow("membership: already_member");
  });

  it("allows renewal once the earlier term has ended", async () => {
    const userId = await db.createUser();
    const earlier = new Date(NOW.getTime() - 366 * 24 * 60 * 60 * 1000);
    await activate(userId, nextPhone(), "BANK-G-0001", earlier);

    const renewal = await openPurchase(userId, nextPhone());
    const result = await verify(renewal.id, "BANK-G-0002");
    expect(result.result).toBe("activated");
  });
});

describe("redemptions", () => {
  it("allows exactly six reservations on a term and refuses the seventh", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-H-0001");

    for (let index = 1; index <= 6; index += 1) {
      await expect(reserve(termId, `HB-H-${index}`)).resolves.toMatchObject({ result: "reserved" });
    }
    await expect(reserve(termId, "HB-H-7")).rejects.toThrow("membership: allowance_used");
    expect((await termRow(termId)).discounts_reserved).toBe(6);
  });

  it("returns the existing redemption for a repeated order reference without counting it twice", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-I-0001");
    await reserve(termId, "HB-I-1");

    await expect(reserve(termId, "HB-I-1")).resolves.toMatchObject({ result: "existing", status: "reserved" });
    expect((await termRow(termId)).discounts_reserved).toBe(1);
  });

  it("never overspends the allowance when checkouts arrive together", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-J-0001");

    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, (_, index) => reserve(termId, `HB-J-${index}`)),
    );

    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(6);
    expect((await termRow(termId)).discounts_reserved).toBe(6);
  });

  it("refuses reservations once the term has ended", async () => {
    const userId = await db.createUser();
    const longAgo = new Date(NOW.getTime() - 2 * 366 * 24 * 60 * 60 * 1000);
    const termId = await activate(userId, nextPhone(), "BANK-K-0001", longAgo);

    await expect(reserve(termId, "HB-K-1")).rejects.toThrow("membership: term_not_active");
  });
});

describe("order lifecycle", () => {
  it("releases a reservation and frees its allowance", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-L-0001");
    await reserve(termId, "HB-L-1");

    await applyChange("HB-L-1", {
      expected_status: "reserved",
      new_status: "released",
      reserved_delta: -1,
    });

    expect(await termRow(termId)).toMatchObject({ discounts_reserved: 0, discounts_used: 0 });
  });

  it("consumes on fulfilment, and restores the benefit to the same term on a full refund without extending it", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-M-0001");
    await reserve(termId, "HB-M-1", 34_990);
    const before = await termRow(termId);

    await applyChange("HB-M-1", {
      expected_status: "reserved",
      new_status: "consumed",
      reserved_delta: -1,
      used_delta: 1,
    });
    expect(await termRow(termId)).toMatchObject({ discounts_used: 1, discounts_reserved: 0 });

    await applyChange("HB-M-1", {
      expected_status: "consumed",
      new_status: "restored",
      used_delta: -1,
      expected_reversed_minor: 0,
      new_reversed_minor: 34_990,
      expected_refunded_minor: 0,
      new_refunded_minor: 265_010,
    });

    const after = await termRow(termId);
    expect(after).toMatchObject({ discounts_used: 0, discounts_reserved: 0 });
    expect(after.expires_at.toISOString()).toBe(before.expires_at.toISOString());
  });

  it("keeps the benefit consumed on a partial refund and records the reversed discount", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-N-0001");
    await reserve(termId, "HB-N-1", 34_990);
    await applyChange("HB-N-1", {
      expected_status: "reserved",
      new_status: "consumed",
      reserved_delta: -1,
      used_delta: 1,
    });

    await applyChange("HB-N-1", {
      expected_status: "consumed",
      new_status: "consumed",
      expected_reversed_minor: 0,
      new_reversed_minor: 11_663,
      expected_refunded_minor: 0,
      new_refunded_minor: 80_000,
    });

    expect(await termRow(termId)).toMatchObject({ discounts_used: 1 });
    const [row] = await db.query<{ reversed_discount_minor: number; refunded_paid_minor: number }>(
      "select reversed_discount_minor, refunded_paid_minor from membership_redemptions where order_reference = 'HB-N-1'",
    );
    expect(row).toMatchObject({ reversed_discount_minor: 11_663, refunded_paid_minor: 80_000 });
  });

  it("rejects a change made against a state that has already moved on", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-O-0001");
    await reserve(termId, "HB-O-1");
    await applyChange("HB-O-1", { expected_status: "reserved", new_status: "released", reserved_delta: -1 });

    await expect(
      applyChange("HB-O-1", { expected_status: "reserved", new_status: "consumed", reserved_delta: -1, used_delta: 1 }),
    ).rejects.toThrow("membership: stale_redemption");
    expect(await termRow(termId)).toMatchObject({ discounts_used: 0, discounts_reserved: 0 });
  });
});

describe("admin corrections, audit and reporting", () => {
  it("requires a reason for a correction and records the before and after states", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-P-0001");

    await expect(
      db.rpc("membership_admin_correct_term", { term_id: termId, actor: "admin@honeyb.test", reason: "  " }),
    ).rejects.toThrow("membership: reason_required");

    await db.rpc("membership_admin_correct_term", {
      term_id: termId,
      actor: "admin@honeyb.test",
      reason: "Suspended pending a chargeback review",
      status: "suspended",
    });

    const [audit] = await db.query<{
      before_state: { status: string };
      after_state: { status: string };
      reason: string;
    }>(
      "select before_state, after_state, reason from membership_audit_events where entity_id = $1 and action = 'term.corrected'",
      [termId],
    );
    expect(audit.before_state.status).toBe("active");
    expect(audit.after_state.status).toBe("suspended");
    expect(audit.reason).toBe("Suspended pending a chargeback review");
  });

  it("keeps the audit log append-only", async () => {
    await expect(db.query("update membership_audit_events set reason = 'changed'")).rejects.toThrow(
      "audit events are append-only",
    );
    await expect(db.query("delete from membership_audit_events")).rejects.toThrow("audit events are append-only");
  });

  it("reports fees and product discounts separately, with discounts net of reversals", async () => {
    const totals = (await db.rpc("membership_report", {
      from: "2000-01-01T00:00:00Z",
      to: "2100-01-01T00:00:00Z",
    })) as Record<string, number>;

    expect(totals.fees_collected_minor).toBe(totals.fee_payments * MEMBERSHIP.feeMinor);
    expect(totals.net_discount_cost_minor).toBe(totals.discounts_granted_minor - totals.discounts_reversed_minor);
    expect(totals.member_orders_fulfilled).toBeGreaterThanOrEqual(2);
  });

  it("recognises an admin only when the account is in membership_admins", async () => {
    const userId = await db.createUser();
    expect(await db.rpc("membership_is_admin", { user_id: userId })).toEqual({ admin: false });

    await db.query("insert into membership_admins (user_id, granted_by) values ($1, 'test')", [userId]);
    expect(await db.rpc("membership_is_admin", { user_id: userId })).toEqual({ admin: true });
  });
});

describe("reminders, preferences and customer data", () => {
  it("claims each reminder once, so a repeated scheduler run never queues it again", async () => {
    const userId = await db.createUser();
    const payload = {
      dedupe_key: `renewal_30_days:${userId}:2027-11-06`,
      user_id: userId,
      kind: "renewal_30_days",
      channel: "email",
      scheduled_for: "2027-10-07T00:00:00Z",
    };

    expect(await db.rpc("membership_claim_reminder", payload)).toEqual({ claimed: true });
    expect(await db.rpc("membership_claim_reminder", payload)).toEqual({ claimed: false });
  });

  it("keeps reorder reminders off until the customer opts in", async () => {
    const userId = await db.createUser();
    await db.rpc("membership_save_reminder_preferences", {
      user_id: userId,
      renewal_reminders: true,
      reorder_reminders: false,
    });

    const snapshot = (await db.rpc("membership_account_snapshot", { user_id: userId })) as {
      reminder_preferences: { renewal_reminders: boolean; reorder_reminders: boolean };
    };
    expect(snapshot.reminder_preferences).toMatchObject({ renewal_reminders: true, reorder_reminders: false });

    await db.rpc("membership_save_reminder_preferences", {
      user_id: userId,
      renewal_reminders: true,
      reorder_reminders: true,
    });
    await db.rpc("membership_save_reminder_preferences", {
      user_id: userId,
      renewal_reminders: false,
      reorder_reminders: true,
    });
    const updated = (await db.rpc("membership_account_snapshot", { user_id: userId })) as {
      reminder_preferences: { renewal_reminders: boolean; reorder_reminders: boolean };
    };
    expect(updated.reminder_preferences).toMatchObject({ renewal_reminders: false, reorder_reminders: true });
  });

  it("returns only the requesting customer's terms in the account snapshot", async () => {
    const owner = await db.createUser();
    await activate(owner, nextPhone(), "BANK-Q-0001");
    const stranger = await db.createUser();

    const snapshot = (await db.rpc("membership_account_snapshot", { user_id: stranger })) as { terms: unknown[] };
    expect(snapshot.terms).toEqual([]);
  });
});

describe("audit attribution and member search", () => {
  it("refuses a redemption change without an actor or a reason", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-R-0001");
    await reserve(termId, "HB-R-1");

    await expect(
      db.rpc("membership_apply_redemption_change", {
        order_reference: "HB-R-1",
        expected_status: "reserved",
        new_status: "released",
        used_delta: 0,
        reserved_delta: -1,
        expected_reversed_minor: 0,
        new_reversed_minor: 0,
        expected_refunded_minor: 0,
        new_refunded_minor: 0,
        actor: "",
        reason: "Released",
      }),
    ).rejects.toThrow("membership: actor_required");

    await expect(
      db.rpc("membership_apply_redemption_change", {
        order_reference: "HB-R-1",
        expected_status: "reserved",
        new_status: "released",
        used_delta: 0,
        reserved_delta: -1,
        expected_reversed_minor: 0,
        new_reversed_minor: 0,
        expected_refunded_minor: 0,
        new_refunded_minor: 0,
        actor: "admin@honeyb.test",
        reason: "   ",
      }),
    ).rejects.toThrow("membership: reason_required");

    const [row] = await db.query<{ status: string }>(
      "select status from membership_redemptions where order_reference = 'HB-R-1'",
    );
    expect(row.status).toBe("reserved");
  });

  it("writes an audit row with the actor and the before and after states for each change", async () => {
    const termId = await activate(await db.createUser(), nextPhone(), "BANK-S-0001");
    await reserve(termId, "HB-S-1");
    const [before] = await db.query<{ n: number }>("select count(*)::int as n from membership_audit_events");

    await db.rpc("membership_apply_redemption_change", {
      order_reference: "HB-S-1",
      expected_status: "reserved",
      new_status: "released",
      used_delta: 0,
      reserved_delta: -1,
      expected_reversed_minor: 0,
      new_reversed_minor: 0,
      expected_refunded_minor: 0,
      new_refunded_minor: 0,
      actor: "system:checkout",
      reason: "Order could not be delivered",
      audit_action: "redemption.released",
    });

    const [after] = await db.query<{ n: number }>("select count(*)::int as n from membership_audit_events");
    expect(after.n).toBe(before.n + 1);
    const [entry] = await db.query<{
      actor: string;
      action: string;
      before_state: { status: string };
      after_state: { status: string };
    }>(
      "select actor, action, before_state, after_state from membership_audit_events where entity_type = 'membership_redemption' order by created_at desc limit 1",
    );
    expect(entry).toMatchObject({ actor: "system:checkout", action: "redemption.released" });
    expect(entry.before_state.status).toBe("reserved");
    expect(entry.after_state.status).toBe("released");
  });

  it("refuses an empty or short member search instead of listing every member", async () => {
    await activate(await db.createUser(), nextPhone(), "BANK-T-0001");

    expect(await db.rpc("membership_admin_search_terms", { query: "", limit: 50 })).toEqual([]);
    expect(await db.rpc("membership_admin_search_terms", { query: "abc", limit: 50 })).toEqual([]);
    expect(await db.rpc("membership_admin_search_terms", { query: "12", limit: 50 })).toEqual([]);
  });

  it("finds a member by four or more phone digits, or by an exact account id", async () => {
    const userId = await db.createUser();
    const phone = "03219876543";
    await activate(userId, phone, "BANK-U-0001");

    const byDigits = (await db.rpc("membership_admin_search_terms", { query: "9876", limit: 50 })) as {
      phone: string;
    }[];
    expect(byDigits.map((term) => term.phone)).toContain(phone);

    const byAccount = (await db.rpc("membership_admin_search_terms", { query: userId, limit: 50 })) as {
      customer_user_id: string;
    }[];
    expect(byAccount.map((term) => term.customer_user_id)).toContain(userId);
  });
});
