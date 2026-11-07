// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { CustomerOrderRepository } from "@/services/customerOrder.repository";
import {
  combineOrderRecorders,
  createCustomerOrderRecorder,
  toCustomerOrderInput,
} from "@/services/customerOrder.recorder";

import { createMembershipTestDatabase, type MembershipTestDatabase } from "../fakes/membershipDatabase";

import type { OrderRequest } from "@/services/inquiry.types";

const DATABASE_HOOK_TIMEOUT_MS = 60_000;

const order: OrderRequest = {
  reference: "HB-REC-0001",
  createdAt: "2026-11-07T10:00:00.000Z",
  customer: {
    name: "Ayesha Khan",
    phone: "03001234567",
    email: "ayesha@example.com",
    city: "Lahore",
    address: "House 12, Model Town",
    referral: null,
    notes: "Ring before arriving",
  },
  lines: [
    {
      varietySlug: "sidr-honey",
      sizeId: "500g",
      name: "Sidr Honey",
      sizeLabel: "500 g",
      quantity: 2,
      unitPrice: 1970,
      lineTotal: 3940,
    },
  ],
  subtotal: 3940,
  membership: { discountMinor: 35_000 },
};

describe("toCustomerOrderInput", () => {
  it("stores amounts in paisa and the total after the membership discount", () => {
    const input = toCustomerOrderInput(order);
    expect(input).toMatchObject({
      reference: "HB-REC-0001",
      subtotalMinor: 394_000,
      membershipDiscountMinor: 35_000,
      totalMinor: 359_000,
    });
    expect(input.items).toEqual([
      {
        lineKey: "sidr-honey:500g",
        name: "Sidr Honey",
        sizeLabel: "500 g",
        quantity: 2,
        unitPriceMinor: 197_000,
        lineTotalMinor: 394_000,
      },
    ]);
  });

  it("stores a non-member order with no discount and the full total", () => {
    const input = toCustomerOrderInput({ ...order, membership: undefined });
    expect(input).toMatchObject({ membershipDiscountMinor: 0, totalMinor: 394_000 });
  });
});

describe("combineOrderRecorders", () => {
  it("keeps recording when one recorder fails, and never throws to the checkout", async () => {
    const failing = { record: vi.fn(async () => Promise.reject(new Error("database down"))) };
    const working = { record: vi.fn(async () => {}) };

    await expect(combineOrderRecorders([failing, working]).record(order)).resolves.toBeUndefined();
    expect(working.record).toHaveBeenCalledWith(order);
  });
});

describe("recording into the database", () => {
  let db: MembershipTestDatabase;

  beforeAll(async () => {
    db = await createMembershipTestDatabase();
  }, DATABASE_HOOK_TIMEOUT_MS);

  afterAll(async () => {
    await db.close();
  }, DATABASE_HOOK_TIMEOUT_MS);

  it("saves a placed order so it can be read back with its lines", async () => {
    const repo = new CustomerOrderRepository(db.rpc);
    await createCustomerOrderRecorder(repo).record(order);

    const saved = await repo.get("HB-REC-0001");
    expect(saved).toMatchObject({
      reference: "HB-REC-0001",
      status: "new",
      customerName: "Ayesha Khan",
      phone: "03001234567",
      totalMinor: 359_000,
      membershipDiscountMinor: 35_000,
      notes: "Ring before arriving",
    });
    expect(saved?.items).toHaveLength(1);
  });

  it("saves a repeated order only once", async () => {
    const repo = new CustomerOrderRepository(db.rpc);
    const recorder = createCustomerOrderRecorder(repo);
    await recorder.record(order);
    await recorder.record(order);

    const result = await repo.search({ query: "HB-REC-0001", limit: 10, offset: 0 });
    expect(result.total).toBe(1);
  });
});
