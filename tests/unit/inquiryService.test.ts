import { describe, expect, it, vi } from "vitest";

import { createOrderReference, InquiryService } from "@/services/inquiry.service";

import type { InquiryInput } from "@/lib/validations/inquiry.schema";
import type { InquiryNotifier, OrderRequest } from "@/services/inquiry.types";

const baseInput: InquiryInput = {
  name: "  Ayesha\r\nKhan ",
  phone: "0300 123-4567",
  email: "Ayesha@Example.com",
  city: "Lahore",
  address: "House 12,\r\nModel Town",
  notes: "",
  items: [
    { varietySlug: "sidr-honey", sizeId: "1kg", quantity: 1 },
    { varietySlug: "sidr-honey", sizeId: "1kg", quantity: 2 },
    { varietySlug: "acacia-honey", sizeId: "500g", quantity: 1 },
  ],
  idempotencyKey: "4f9b2c1e-8d7a-4b3c-9e6f-1a2b3c4d5e6f",
};

function createNotifier(overrides: Partial<InquiryNotifier> = {}) {
  const sent: OrderRequest[] = [];
  const notifier: InquiryNotifier = {
    notifyOwner: vi.fn(async (order: OrderRequest) => {
      sent.push(order);
    }),
    notifyCustomer: vi.fn(async () => {}),
    ...overrides,
  };
  return { notifier, sent };
}

const createService = (notifier: InquiryNotifier) =>
  new InquiryService({ notifier, now: () => new Date("2026-10-31T10:00:00Z"), createReference: () => "HB-TEST-0001" });

describe("InquiryService", () => {
  it("prices lines from the catalogue, merges duplicates and normalises customer data", async () => {
    const { notifier, sent } = createNotifier();
    const result = await createService(notifier).submit(baseInput);

    expect(result).toEqual({ ok: true, reference: "HB-TEST-0001" });
    const [order] = sent;
    expect(order.lines).toEqual([
      expect.objectContaining({
        varietySlug: "sidr-honey",
        sizeId: "1kg",
        quantity: 3,
        unitPrice: 6000,
        lineTotal: 18000,
      }),
      expect.objectContaining({
        varietySlug: "acacia-honey",
        sizeId: "500g",
        quantity: 1,
        unitPrice: 1900,
        lineTotal: 1900,
      }),
    ]);
    expect(order.subtotal).toBe(19900);
    expect(order.customer).toEqual({
      name: "Ayesha Khan",
      phone: "03001234567",
      email: "ayesha@example.com",
      city: "Lahore",
      address: "House 12,\nModel Town",
      notes: null,
    });
    expect(notifier.notifyCustomer).toHaveBeenCalledOnce();
  });

  it("rejects items that are not in the catalogue without notifying anyone", async () => {
    const { notifier } = createNotifier();
    const result = await createService(notifier).submit({
      ...baseInput,
      items: [{ varietySlug: "fake-honey", sizeId: "1kg", quantity: 1 }],
    });
    expect(result).toMatchObject({ ok: false, reason: "invalid_items" });
    expect(notifier.notifyOwner).not.toHaveBeenCalled();
  });

  it("returns the same result for a repeated idempotency key", async () => {
    const { notifier } = createNotifier();
    const service = createService(notifier);
    const [first, second] = await Promise.all([service.submit(baseInput), service.submit(baseInput)]);
    expect(first).toEqual(second);
    expect(notifier.notifyOwner).toHaveBeenCalledOnce();
  });

  it("fails safely when the owner notification fails and allows a retry", async () => {
    const notifyOwner = vi.fn().mockRejectedValueOnce(new Error("provider down")).mockResolvedValueOnce(undefined);
    const { notifier } = createNotifier({ notifyOwner });
    const service = createService(notifier);

    expect(await service.submit(baseInput)).toMatchObject({ ok: false, reason: "delivery_failed" });
    expect(await service.submit(baseInput)).toEqual({ ok: true, reference: "HB-TEST-0001" });
    expect(notifyOwner).toHaveBeenCalledTimes(2);
  });

  it("still succeeds when only the customer confirmation fails", async () => {
    const { notifier } = createNotifier({ notifyCustomer: vi.fn().mockRejectedValue(new Error("bounce")) });
    expect(await createService(notifier).submit(baseInput)).toEqual({ ok: true, reference: "HB-TEST-0001" });
  });

  it("skips the customer email when none was given", async () => {
    const { notifier } = createNotifier();
    await createService(notifier).submit({ ...baseInput, email: "" });
    expect(notifier.notifyCustomer).not.toHaveBeenCalled();
  });
});

describe("createOrderReference", () => {
  it("builds a dated, readable reference", () => {
    expect(createOrderReference(new Date("2026-10-31T10:00:00Z"), () => 0.5)).toMatch(/^HB-261031-[0-9A-Z]{4}$/);
  });
});
