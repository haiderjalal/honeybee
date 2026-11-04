import { describe, expect, it, vi } from "vitest";

import { InquiryService } from "@/services/inquiry.service";

import type { InquiryInput } from "@/lib/validations/inquiry.schema";
import type { InquiryNotifier, OrderRecorder, OrderRequest } from "@/services/inquiry.types";

const input: InquiryInput = {
  name: "Ayesha Khan",
  phone: "03001234567",
  email: "",
  city: "Lahore",
  address: "House 12, Model Town",
  referral: "",
  notes: "",
  items: [{ varietySlug: "sidr-honey", sizeId: "1kg", quantity: 1 }],
  idempotencyKey: "4f9b2c1e-8d7a-4b3c-9e6f-1a2b3c4d5e6f",
};

const healthyNotifier = (): InquiryNotifier => ({
  notifyOwner: vi.fn(async () => {}),
  notifyCustomer: vi.fn(async () => {}),
});

const createService = (notifier: InquiryNotifier, recorder: OrderRecorder | null) =>
  new InquiryService({
    notifier,
    recorder,
    now: () => new Date("2026-10-31T10:00:00Z"),
    createReference: () => "HB-TEST-0002",
  });

describe("InquiryService order recording", () => {
  it("records the order after the owner has been notified", async () => {
    const calls: string[] = [];
    const notifier: InquiryNotifier = {
      notifyOwner: vi.fn(async () => {
        calls.push("owner");
      }),
      notifyCustomer: vi.fn(async () => {}),
    };
    const recorder: OrderRecorder = {
      record: vi.fn(async (order: OrderRequest) => {
        calls.push(`record:${order.reference}`);
      }),
    };

    await createService(notifier, recorder).submit(input);

    expect(calls).toEqual(["owner", "record:HB-TEST-0002"]);
  });

  it("keeps the order when the sheet write fails", async () => {
    const recorder: OrderRecorder = {
      record: vi.fn(async () => {
        throw new Error("sheet unavailable");
      }),
    };

    const result = await createService(healthyNotifier(), recorder).submit(input);

    expect(result).toEqual({ ok: true, reference: "HB-TEST-0002" });
  });

  it("does not record an order the owner never received", async () => {
    const notifier: InquiryNotifier = {
      notifyOwner: vi.fn(async () => {
        throw new Error("email provider down");
      }),
      notifyCustomer: vi.fn(async () => {}),
    };
    const recorder: OrderRecorder = { record: vi.fn(async () => {}) };

    const result = await createService(notifier, recorder).submit(input);

    expect(result).toMatchObject({ ok: false, reason: "delivery_failed" });
    expect(recorder.record).not.toHaveBeenCalled();
  });

  it("hands the follow-up work to the caller when it can defer it", async () => {
    const deferred: Promise<void>[] = [];
    const recorder: OrderRecorder = { record: vi.fn(async () => {}) };

    const result = await createService(healthyNotifier(), recorder).submit(input, {
      defer: (work) => {
        deferred.push(work);
      },
    });

    expect(result).toEqual({ ok: true, reference: "HB-TEST-0002" });
    await Promise.all(deferred);
    expect(recorder.record).toHaveBeenCalledTimes(1);
  });
});
