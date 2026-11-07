// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createMembershipTestDatabase, type MembershipTestDatabase } from "../fakes/membershipDatabase";

/** The customer orders functions, run against the real migrations in embedded Postgres. */

const DATABASE_HOOK_TIMEOUT_MS = 60_000;

let db: MembershipTestDatabase;

beforeAll(async () => {
  db = await createMembershipTestDatabase();
}, DATABASE_HOOK_TIMEOUT_MS);

afterAll(async () => {
  await db.close();
}, DATABASE_HOOK_TIMEOUT_MS);

function orderPayload(reference: string, overrides: Record<string, unknown> = {}) {
  return {
    reference,
    customer_name: "Ayesha Khan",
    phone: "03001234567",
    email: "ayesha@example.com",
    city: "Lahore",
    address: "House 12, Model Town",
    referral: null,
    notes: null,
    subtotal_minor: 394_000,
    membership_discount_minor: 0,
    total_minor: 394_000,
    created_at: "2026-11-01T10:00:00Z",
    items: [
      {
        line_key: "sidr-honey:500g",
        name: "Sidr Honey",
        size_label: "500 g",
        quantity: 2,
        unit_price_minor: 197_000,
        line_total_minor: 394_000,
      },
    ],
    ...overrides,
  };
}

interface SearchResult {
  total: number;
  rows: { reference: string; status: string; total_minor: number }[];
}

describe("saving orders", () => {
  it("saves an order with its lines", async () => {
    const result = (await db.rpc("customer_order_insert", orderPayload("HB-SAVE-0001"))) as { result: string };
    expect(result.result).toBe("inserted");

    const [row] = await db.query<{ count: number }>(
      "select count(*)::int as count from customer_order_items i join customer_orders o on o.id = i.order_id where o.reference = 'HB-SAVE-0001'",
    );
    expect(row.count).toBe(1);
  });

  it("does not save the same reference twice, so a retry cannot duplicate an order", async () => {
    await db.rpc("customer_order_insert", orderPayload("HB-SAVE-0002"));
    const again = (await db.rpc("customer_order_insert", orderPayload("HB-SAVE-0002"))) as { result: string };

    expect(again.result).toBe("existing");
    const [orders] = await db.query<{ count: number }>(
      "select count(*)::int as count from customer_orders where reference = 'HB-SAVE-0002'",
    );
    const [items] = await db.query<{ count: number }>(
      "select count(*)::int as count from customer_order_items i join customer_orders o on o.id = i.order_id where o.reference = 'HB-SAVE-0002'",
    );
    expect(orders.count).toBe(1);
    expect(items.count).toBe(1);
  });

  it("refuses a total that does not equal the subtotal less the membership discount", async () => {
    await expect(
      db.rpc(
        "customer_order_insert",
        orderPayload("HB-SAVE-0003", { membership_discount_minor: 35_000, total_minor: 394_000 }),
      ),
    ).rejects.toThrow();
  });

  it("stores the membership discount with the total to confirm", async () => {
    await db.rpc(
      "customer_order_insert",
      orderPayload("HB-SAVE-0004", { membership_discount_minor: 35_000, total_minor: 359_000 }),
    );
    const order = (await db.rpc("customer_order_get", { reference: "HB-SAVE-0004" })) as {
      order: { membership_discount_minor: number; total_minor: number };
    };
    expect(order.order).toMatchObject({ membership_discount_minor: 35_000, total_minor: 359_000 });
  });
});

describe("listing and searching orders", () => {
  it("lists every order, newest first, when the search is empty", async () => {
    await db.rpc("customer_order_insert", orderPayload("HB-LIST-0001", { created_at: "2026-11-02T10:00:00Z" }));
    await db.rpc("customer_order_insert", orderPayload("HB-LIST-0002", { created_at: "2026-11-03T10:00:00Z" }));

    const result = (await db.rpc("customer_orders_search", { query: "", limit: 50, offset: 0 })) as SearchResult;
    const listRefs = result.rows.map((row) => row.reference).filter((ref) => ref.startsWith("HB-LIST-"));
    expect(listRefs).toEqual(["HB-LIST-0002", "HB-LIST-0001"]);
    expect(result.total).toBeGreaterThanOrEqual(2);
  });

  it("finds an order by part of its reference, ignoring case", async () => {
    const result = (await db.rpc("customer_orders_search", { query: "list-0002" })) as SearchResult;
    expect(result.rows.map((row) => row.reference)).toEqual(["HB-LIST-0002"]);
  });

  it("filters by status", async () => {
    await db.rpc("customer_order_set_status", {
      reference: "HB-LIST-0002",
      status: "confirmed",
      actor: "admin@honeyb.test",
      reason: "Confirmed by phone",
    });
    const confirmed = (await db.rpc("customer_orders_search", { query: "", status: "confirmed" })) as SearchResult;
    expect(confirmed.rows.map((row) => row.reference)).toContain("HB-LIST-0002");
    expect(confirmed.rows.map((row) => row.reference)).not.toContain("HB-LIST-0001");
  });

  it("pages through results with limit and offset", async () => {
    const first = (await db.rpc("customer_orders_search", { query: "HB-LIST-", limit: 1, offset: 0 })) as SearchResult;
    const second = (await db.rpc("customer_orders_search", { query: "HB-LIST-", limit: 1, offset: 1 })) as SearchResult;

    expect(first.total).toBe(2);
    expect(first.rows).toHaveLength(1);
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0].reference).not.toBe(first.rows[0].reference);
  });
});

describe("reading and changing orders", () => {
  it("returns an order with its lines", async () => {
    const result = (await db.rpc("customer_order_get", { reference: "HB-SAVE-0001" })) as {
      order: { reference: string; customer_name: string };
      items: { line_key: string }[];
    };
    expect(result.order).toMatchObject({ reference: "HB-SAVE-0001", customer_name: "Ayesha Khan" });
    expect(result.items.map((item) => item.line_key)).toEqual(["sidr-honey:500g"]);
  });

  it("returns nothing for an unknown reference", async () => {
    const result = (await db.rpc("customer_order_get", { reference: "HB-NOPE-0000" })) as {
      order: unknown;
      items: unknown[];
    };
    expect(result.order).toBeNull();
    expect(result.items).toEqual([]);
  });

  it("records each status change in the audit log with the actor and reason", async () => {
    await db.rpc("customer_order_insert", orderPayload("HB-AUDIT-0001"));
    await db.rpc("customer_order_set_status", {
      reference: "HB-AUDIT-0001",
      status: "contacted",
      actor: "admin@honeyb.test",
      reason: "Called the customer",
    });

    const [audit] = await db.query<{
      actor: string;
      action: string;
      reason: string;
      before_state: { status: string };
      after_state: { status: string };
    }>(
      "select actor, action, reason, before_state, after_state from membership_audit_events where entity_type = 'customer_order' and reason = 'Called the customer'",
    );
    expect(audit).toMatchObject({
      actor: "admin@honeyb.test",
      action: "order.status_changed",
      reason: "Called the customer",
    });
    expect(audit.before_state.status).toBe("new");
    expect(audit.after_state.status).toBe("contacted");
  });

  it("refuses a status change without an actor or a reason", async () => {
    await expect(
      db.rpc("customer_order_set_status", { reference: "HB-AUDIT-0001", status: "fulfilled", actor: "", reason: "x" }),
    ).rejects.toThrow("membership: actor_required");
    await expect(
      db.rpc("customer_order_set_status", {
        reference: "HB-AUDIT-0001",
        status: "fulfilled",
        actor: "a@b.test",
        reason: " ",
      }),
    ).rejects.toThrow("membership: reason_required");
  });

  it("refuses an unknown status", async () => {
    await expect(
      db.rpc("customer_order_set_status", {
        reference: "HB-AUDIT-0001",
        status: "shipped",
        actor: "a@b.test",
        reason: "Sent",
      }),
    ).rejects.toThrow("membership: invalid_status");
  });
});
