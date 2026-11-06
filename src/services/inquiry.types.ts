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
  referral: string | null;
  notes: string | null;
}

/** The member discount reserved for an order. Amounts are minor units (paisa), unlike the whole-rupee subtotal. */
export interface OrderMembership {
  discountMinor: number;
}

/** A fully validated, server-priced order request. */
export interface OrderRequest {
  reference: string;
  createdAt: string;
  customer: OrderCustomer;
  lines: OrderLine[];
  subtotal: number;
  /** Present only when a member discount was reserved, so non-member orders keep their existing shape. */
  membership?: OrderMembership;
}

export interface OrderMembershipReservation {
  discountMinor: number;
}

/**
 * Membership hooks for order creation. A reserved discount is released when the order cannot be delivered.
 * Implementations must never throw for ordinary "not eligible" outcomes; those return null.
 */
export interface OrderMembershipPort {
  reserve(input: {
    customerUserId: string;
    orderReference: string;
    lines: OrderLine[];
    now: Date;
  }): Promise<OrderMembershipReservation | null>;
  release(orderReference: string): Promise<void>;
}

/** Delivery channel for new orders (email today; WhatsApp or a database can implement this later). */
export interface InquiryNotifier {
  notifyOwner(order: OrderRequest): Promise<void>;
  notifyCustomer(order: OrderRequest): Promise<void>;
}

/** Keeps a copy of every accepted order, e.g. in a spreadsheet. Best-effort: a failure never rejects the order. */
export interface OrderRecorder {
  record(order: OrderRequest): Promise<void>;
}

export type InquiryResult =
  { ok: true; reference: string } | { ok: false; reason: "invalid_items" | "delivery_failed"; message: string };
