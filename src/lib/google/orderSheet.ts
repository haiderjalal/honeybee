import "server-only";

import { createAccessTokenProvider } from "@/lib/google/serviceAccount";
import { appendSheetRow, type SheetTarget } from "@/lib/google/sheets";
import { logger } from "@/lib/logger";

import type { ServerEnv } from "@/lib/env";
import type { OrderRecorder, OrderRequest } from "@/services/inquiry.types";

const DEFAULT_TAB = "Orders";

/** Column headers for the order tab, in the same order as `orderSheetRow`. */
export const ORDER_SHEET_HEADERS = [
  "Created (PKT)",
  "Reference",
  "Name",
  "Phone",
  "Email",
  "City",
  "Address",
  "Referred by",
  "Notes",
  "Items",
  "Subtotal (PKR)",
  "Status",
] as const;

const PAKISTAN_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  dateStyle: "medium",
  timeStyle: "short",
});

/** One sheet row per order. The team edits the Status column by hand after a call. */
export function orderSheetRow(order: OrderRequest): (string | number)[] {
  const { customer } = order;
  return [
    PAKISTAN_TIME.format(new Date(order.createdAt)),
    order.reference,
    customer.name,
    customer.phone,
    customer.email ?? "",
    customer.city,
    customer.address,
    customer.referral ?? "",
    customer.notes ?? "",
    order.lines.map((line) => `${line.name} ${line.sizeLabel} × ${line.quantity}`).join("; "),
    order.subtotal,
    "New",
  ];
}

export class OrderSheetRecorder implements OrderRecorder {
  constructor(private readonly target: SheetTarget) {}

  async record(order: OrderRequest): Promise<void> {
    await appendSheetRow(this.target, orderSheetRow(order));
  }
}

/**
 * Returns the sheet recorder, or null when the sheet is not configured. A partly configured sheet is
 * logged and skipped rather than blocking orders, because the owner email already carries each order.
 */
export function createOrderRecorder(env: ServerEnv): OrderRecorder | null {
  const { GOOGLE_SHEET_ID: sheetId, GOOGLE_SERVICE_ACCOUNT_EMAIL: email, GOOGLE_PRIVATE_KEY: privateKey } = env;

  if (!sheetId && !email && !privateKey) return null;
  if (!sheetId || !email || !privateKey) {
    logger.error("Google order sheet is partly configured; orders are not being recorded", {});
    return null;
  }

  return new OrderSheetRecorder({
    sheetId,
    tab: env.GOOGLE_SHEET_TAB || DEFAULT_TAB,
    // Hosting dashboards often store the key with literal "\n" sequences; restore real newlines.
    getAccessToken: createAccessTokenProvider({ email, privateKey: privateKey.replace(/\\n/g, "\n") }),
  });
}
