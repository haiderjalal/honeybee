// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CustomerOrderRepository } from "@/services/customerOrder.repository";

import { createMembershipTestDatabase, type MembershipTestDatabase } from "../fakes/membershipDatabase";

const DATABASE_HOOK_TIMEOUT_MS = 60_000;

let db: MembershipTestDatabase;
let repo: CustomerOrderRepository;

beforeAll(async () => {
  db = await createMembershipTestDatabase();
  repo = new CustomerOrderRepository(db.rpc);
}, DATABASE_HOOK_TIMEOUT_MS);

afterAll(async () => {
  await db.close();
}, DATABASE_HOOK_TIMEOUT_MS);

function order(reference: string, customerName: string, createdAt: string) {
  return {
    reference,
    customerName,
    phone: "03001234567",
    email: null,
    city: "Lahore",
    address: "House 12, Model Town",
    referral: null,
    notes: null,
    subtotalMinor: 100_000,
    membershipDiscountMinor: 0,
    totalMinor: 100_000,
    createdAt: new Date(createdAt),
    items: [
      {
        lineKey: "sidr-honey:1kg",
        name: "Sidr Honey",
        sizeLabel: "1 kg",
        quantity: 1,
        unitPriceMinor: 100_000,
        lineTotalMinor: 100_000,
      },
    ],
  };
}

describe("the honeycomb family", () => {
  it("shows nothing until an admin switches an order on", async () => {
    await repo.insert(order("HB-HONEY-0001", "Saba Anjum Babar", "2026-11-01T10:00:00Z"));
    expect(await repo.honeycombEntries(200)).toEqual([]);
  });

  it("lists agreed orders oldest first, and only the public fields", async () => {
    await repo.insert(order("HB-HONEY-0002", "Abdul Rahman", "2026-11-03T10:00:00Z"));
    await repo.insert(order("HB-HONEY-0003", "Faizan", "2026-11-02T10:00:00Z"));
    for (const reference of ["HB-HONEY-0001", "HB-HONEY-0002", "HB-HONEY-0003"]) {
      await repo.setHoneycomb({ reference, show: true, actor: "admin@honeyb.test", reason: "Agreed by phone" });
    }

    const entries = await repo.honeycombEntries(200);
    expect(entries.map((entry) => entry.customerName)).toEqual(["Saba Anjum Babar", "Faizan", "Abdul Rahman"]);
    expect(Object.keys(entries[0]).sort()).toEqual(["createdAt", "customerName", "id"]);
  });

  it("removes a customer from the honeycomb when the switch is turned off", async () => {
    await repo.setHoneycomb({
      reference: "HB-HONEY-0003",
      show: false,
      actor: "admin@honeyb.test",
      reason: "Asked to be removed",
    });
    const names = (await repo.honeycombEntries(200)).map((entry) => entry.customerName);
    expect(names).not.toContain("Faizan");
  });

  it("records each change in the audit log with the actor and reason", async () => {
    const [audit] = await db.query<{
      actor: string;
      action: string;
      before_state: { show_on_honeycomb: boolean };
      after_state: { show_on_honeycomb: boolean };
    }>(
      "select actor, action, before_state, after_state from membership_audit_events where action = 'order.honeycomb_changed' and reason = 'Asked to be removed'",
    );
    expect(audit).toMatchObject({ actor: "admin@honeyb.test", action: "order.honeycomb_changed" });
    expect(audit.before_state.show_on_honeycomb).toBe(true);
    expect(audit.after_state.show_on_honeycomb).toBe(false);
  });

  it("refuses a change without a reason", async () => {
    await expect(
      repo.setHoneycomb({ reference: "HB-HONEY-0001", show: false, actor: "admin@honeyb.test", reason: "   " }),
    ).rejects.toThrow("membership: reason_required");
  });

  it("caps the list at the size asked for", async () => {
    expect(await repo.honeycombEntries(1)).toHaveLength(1);
  });
});
