import type { SizeId } from "@/types/catalog";

export interface OrderLine {
  varietySlug: string;
  sizeId: SizeId;
  name: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  notes: string | null;
}

/** A fully validated, server-priced order request. */
export interface OrderRequest {
  reference: string;
  createdAt: string;
  customer: OrderCustomer;
  lines: OrderLine[];
  subtotal: number;
}

/** Delivery channel for new orders (email today; WhatsApp or a database can implement this later). */
export interface InquiryNotifier {
  notifyOwner(order: OrderRequest): Promise<void>;
  notifyCustomer(order: OrderRequest): Promise<void>;
}

export type InquiryResult =
  { ok: true; reference: string } | { ok: false; reason: "invalid_items" | "delivery_failed"; message: string };
