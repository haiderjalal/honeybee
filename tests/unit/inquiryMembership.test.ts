import { describe, expect, it, vi } from "vitest";

import { InquiryService } from "@/services/inquiry.service";
import { ownerInquiryEmail, customerConfirmationEmail } from "@/lib/email/templates";

import type { InquiryInput } from "@/lib/validations/inquiry.schema";
import type { InquiryNotifier, OrderMembershipPort, OrderRequest } from "@/services/inquiry.types";

const baseInput: InquiryInput = {
  name: "Ayesha Khan",
  phone: "03001234567",
  email: "ayesha@example.com",
  city: "Lahore",
  address: "House 12, Model Town",
  notes: "",
  items: [{ varietySlug: "sidr-honey", sizeId: "500g", quantity: 2 }],
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

function createMembership(overrides: Partial<OrderMembershipPort> = {}): OrderMembershipPort {
  return {
    reserve: vi.fn(async () => ({ discountMinor: 35_000 })),
    release: vi.fn(async () => {}),
    ...overrides,
  };
}

const createService = (notifier: InquiryNotifier, membership?: OrderMembershipPort | null) =>
  new InquiryService({
    notifier,
    membership: membership ?? null,
    now: () => new Date("2026-11-06T10:00:00Z"),
    createReference: () => "HB-TEST-0001",
  });

describe("InquiryService with membership", () => {
  it("prices non-member orders exactly as before, with no membership reservation", async () => {
    const membership = createMembership();
    const { notifier, sent } = createNotifier();

    await createService(notifier, membership).submit(baseInput);

    expect(membership.reserve).not.toHaveBeenCalled();
    expect(sent[0]).not.toHaveProperty("membership");
  });

  it("reserves the member discount for a signed-in customer and attaches it to the order", async () => {
    const membership = createMembership();
    const { notifier, sent } = createNotifier();

    const result = await createService(notifier, membership).submit(baseInput, { customerUserId: "user-1" });

    expect(result).toEqual({ ok: true, reference: "HB-TEST-0001" });
    expect(membership.reserve).toHaveBeenCalledWith(
      expect.objectContaining({ customerUserId: "user-1", orderReference: "HB-TEST-0001" }),
    );
    expect(sent[0].membership).toEqual({ discountMinor: 35_000 });
    // The subtotal stays the regular-price total. The discount is applied separately in the emails.
    expect(sent[0].subtotal).toBe(1970 * 2);
  });

  it("releases the reservation when the owner notification fails, so the allowance is not lost", async () => {
    const membership = createMembership();
    const { notifier } = createNotifier({ notifyOwner: vi.fn().mockRejectedValue(new Error("provider down")) });

    const result = await createService(notifier, membership).submit(baseInput, { customerUserId: "user-1" });

    expect(result).toMatchObject({ ok: false, reason: "delivery_failed" });
    expect(membership.release).toHaveBeenCalledWith("HB-TEST-0001");
  });

  it("still places the order at regular prices when the membership check fails unexpectedly", async () => {
    const membership = createMembership({ reserve: vi.fn().mockRejectedValue(new Error("database unavailable")) });
    const { notifier, sent } = createNotifier();

    const result = await createService(notifier, membership).submit(baseInput, { customerUserId: "user-1" });

    expect(result).toEqual({ ok: true, reference: "HB-TEST-0001" });
    expect(sent[0]).not.toHaveProperty("membership");
    expect(membership.release).not.toHaveBeenCalled();
  });

  it("orders at regular prices when no discount is eligible", async () => {
    const membership = createMembership({ reserve: vi.fn(async () => null) });
    const { notifier, sent } = createNotifier();

    await createService(notifier, membership).submit(baseInput, { customerUserId: "user-1" });

    expect(sent[0]).not.toHaveProperty("membership");
  });
});

describe("order emails with a member discount", () => {
  const memberOrder: OrderRequest = {
    reference: "HB-TEST-0001",
    createdAt: "2026-11-06T10:00:00.000Z",
    customer: {
      name: "Ayesha Khan",
      phone: "03001234567",
      email: "ayesha@example.com",
      city: "Lahore",
      address: "House 12",
      referral: null,
      notes: null,
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

  it("shows the member discount and the total to confirm to the customer", () => {
    const email = customerConfirmationEmail(memberOrder);
    expect(email.text).toContain("Member discount (10%): -Rs 350");
    expect(email.text).toContain("Total to confirm: Rs 3,590");
    expect(email.html).toContain("Total to confirm");
  });

  it("tells the owner about the member discount and the total in the subject", () => {
    const email = ownerInquiryEmail(memberOrder);
    expect(email.subject).toContain("Rs 3,590");
    expect(email.text).toContain("Member discount: Rs 350");
  });

  it("leaves non-member emails unchanged", () => {
    const email = customerConfirmationEmail({ ...memberOrder, membership: undefined });
    expect(email.text).not.toContain("Member discount");
    expect(email.text).not.toContain("Total to confirm");
  });
});
