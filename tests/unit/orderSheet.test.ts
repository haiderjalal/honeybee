import { describe, expect, it } from "vitest";

import { createOrderRecorder, ORDER_SHEET_HEADERS, OrderSheetRecorder, orderSheetRow } from "@/lib/google/orderSheet";

import type { ServerEnv } from "@/lib/env";
import type { OrderRequest } from "@/services/inquiry.types";

const baseEnv: ServerEnv = { NODE_ENV: "test" };

const order: OrderRequest = {
  reference: "HB-TEST-0001",
  createdAt: "2026-10-31T10:00:00.000Z",
  customer: {
    name: "Ayesha Khan",
    phone: "03001234567",
    email: null,
    city: "Lahore",
    address: "House 12, Model Town",
    referral: "Sara Ali",
    notes: null,
  },
  lines: [
    {
      varietySlug: "sidr-honey",
      sizeId: "1kg",
      name: "Sidr Honey",
      sizeLabel: "1 kg",
      quantity: 2,
      unitPrice: 3499,
      lineTotal: 6998,
    },
    {
      varietySlug: "acacia-honey",
      sizeId: "500g",
      name: "Acacia Honey",
      sizeLabel: "500 g",
      quantity: 1,
      unitPrice: 1900,
      lineTotal: 1900,
    },
  ],
  subtotal: 8898,
};

describe("orderSheetRow", () => {
  it("maps an order to one row that matches the headers", () => {
    const row = orderSheetRow(order);

    expect(row).toHaveLength(ORDER_SHEET_HEADERS.length);
    expect(row[0]).toContain("2026");
    expect(row.slice(1)).toEqual([
      "HB-TEST-0001",
      "Ayesha Khan",
      "03001234567",
      "",
      "Lahore",
      "House 12, Model Town",
      "Sara Ali",
      "",
      "Sidr Honey 1 kg × 2; Acacia Honey 500 g × 1",
      8898,
      "New",
    ]);
  });
});

describe("createOrderRecorder", () => {
  it("is disabled when no Google variables are set", () => {
    expect(createOrderRecorder(baseEnv)).toBeNull();
  });

  it("is enabled when all required variables are set", () => {
    const recorder = createOrderRecorder({
      ...baseEnv,
      GOOGLE_SHEET_ID: "sheet-123",
      GOOGLE_SERVICE_ACCOUNT_EMAIL: "orders@honyb-test.iam.gserviceaccount.com",
      GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----",
    });
    expect(recorder).toBeInstanceOf(OrderSheetRecorder);
  });

  it("stays disabled, instead of blocking orders, when the setup is incomplete", () => {
    expect(createOrderRecorder({ ...baseEnv, GOOGLE_SHEET_ID: "sheet-123" })).toBeNull();
  });
});
