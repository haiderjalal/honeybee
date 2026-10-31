import { describe, expect, it } from "vitest";

import { inquirySchema } from "@/lib/validations/inquiry.schema";

const valid = {
  name: "Ayesha Khan",
  phone: "0300 1234567",
  email: "",
  city: "Lahore",
  address: "House 12, Street 4, Model Town",
  notes: "",
  items: [{ varietySlug: "sidr-honey", sizeId: "1kg", quantity: 1 }],
  idempotencyKey: "4f9b2c1e-8d7a-4b3c-9e6f-1a2b3c4d5e6f",
};

const errorFields = (input: unknown): string[] => {
  const result = inquirySchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => String(issue.path[0]));
};

describe("inquirySchema", () => {
  it("accepts a valid request", () => {
    expect(inquirySchema.safeParse(valid).success).toBe(true);
  });

  it.each(["03001234567", "+923001234567", "00923001234567", "0300-1234567"])(
    "accepts Pakistani mobile %s",
    (phone) => {
      expect(errorFields({ ...valid, phone })).toEqual([]);
    },
  );

  it.each(["0421234567", "12345", "+14155550100", "0300123456"])("rejects phone %s", (phone) => {
    expect(errorFields({ ...valid, phone })).toEqual(["phone"]);
  });

  it("allows an empty email but rejects a malformed one", () => {
    expect(errorFields({ ...valid, email: "" })).toEqual([]);
    expect(errorFields({ ...valid, email: "not-an-email" })).toEqual(["email"]);
  });

  it("requires name, city and a full address", () => {
    expect(errorFields({ ...valid, name: " ", city: "", address: "short" })).toEqual(["name", "city", "address"]);
  });

  it("rejects an empty cart and out-of-range quantities", () => {
    expect(errorFields({ ...valid, items: [] })).toEqual(["items"]);
    expect(errorFields({ ...valid, items: [{ ...valid.items[0], quantity: 0 }] })).toEqual(["items"]);
    expect(errorFields({ ...valid, items: [{ ...valid.items[0], quantity: 21 }] })).toEqual(["items"]);
    expect(errorFields({ ...valid, items: [{ ...valid.items[0], sizeId: "5kg" }] })).toEqual(["items"]);
  });

  it("requires a UUID idempotency key", () => {
    expect(errorFields({ ...valid, idempotencyKey: "abc" })).toEqual(["idempotencyKey"]);
  });

  it("enforces maximum lengths", () => {
    expect(errorFields({ ...valid, notes: "x".repeat(501) })).toEqual(["notes"]);
  });
});
