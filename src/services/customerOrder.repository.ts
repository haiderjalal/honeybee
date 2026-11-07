import { MembershipDbError, type RpcCaller } from "./membership/membership.repository";

/** Customer orders as stored at checkout. Amounts are minor units (paisa). */

export const CUSTOMER_ORDER_STATUSES = ["new", "contacted", "confirmed", "fulfilled", "cancelled"] as const;
export type CustomerOrderStatus = (typeof CUSTOMER_ORDER_STATUSES)[number];

export interface CustomerOrderInput {
  reference: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  referral: string | null;
  notes: string | null;
  subtotalMinor: number;
  membershipDiscountMinor: number;
  totalMinor: number;
  createdAt: Date;
  items: {
    lineKey: string;
    name: string;
    sizeLabel: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }[];
}

export interface CustomerOrderSummary {
  id: string;
  reference: string;
  status: CustomerOrderStatus;
  customerName: string;
  phone: string;
  city: string;
  subtotalMinor: number;
  membershipDiscountMinor: number;
  totalMinor: number;
  createdAt: Date;
}

export interface CustomerOrderDetail extends CustomerOrderSummary {
  email: string | null;
  address: string;
  referral: string | null;
  notes: string | null;
  updatedAt: Date;
  items: {
    lineKey: string;
    name: string;
    sizeLabel: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }[];
}

export interface SearchCustomerOrdersInput {
  /** Part of an order reference. Empty lists every order. */
  query: string;
  status?: CustomerOrderStatus;
  limit: number;
  offset: number;
}

interface RawSummary {
  id: string;
  reference: string;
  status: CustomerOrderStatus;
  customer_name: string;
  phone: string;
  city: string;
  subtotal_minor: number;
  membership_discount_minor: number;
  total_minor: number;
  created_at: string;
}

interface RawItem {
  line_key: string;
  name: string;
  size_label: string;
  quantity: number;
  unit_price_minor: number;
  line_total_minor: number;
}

const mapSummary = (raw: RawSummary): CustomerOrderSummary => ({
  id: raw.id,
  reference: raw.reference,
  status: raw.status,
  customerName: raw.customer_name,
  phone: raw.phone,
  city: raw.city,
  subtotalMinor: raw.subtotal_minor,
  membershipDiscountMinor: raw.membership_discount_minor,
  totalMinor: raw.total_minor,
  createdAt: new Date(raw.created_at),
});

const mapItem = (raw: RawItem) => ({
  lineKey: raw.line_key,
  name: raw.name,
  sizeLabel: raw.size_label,
  quantity: raw.quantity,
  unitPriceMinor: raw.unit_price_minor,
  lineTotalMinor: raw.line_total_minor,
});

/** Data access for customer orders. Each method calls one database function with a single jsonb payload. */
export class CustomerOrderRepository {
  constructor(private readonly rpc: RpcCaller) {}

  private async call<T>(name: string, payload: Record<string, unknown>): Promise<T> {
    try {
      return (await this.rpc(name, payload)) as T;
    } catch (error) {
      // Re-use the membership error mapping, which turns "membership: <code>" messages into typed errors.
      if (error instanceof Error && /membership: /.test(error.message)) {
        throw new MembershipDbError(error.message.replace(/^.*membership: /, ""));
      }
      throw error;
    }
  }

  /** Saves an order and its lines. A repeated reference is ignored, so retries never duplicate an order. */
  async insert(input: CustomerOrderInput): Promise<"inserted" | "existing"> {
    const raw = await this.call<{ result: "inserted" | "existing" }>("customer_order_insert", {
      reference: input.reference,
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email,
      city: input.city,
      address: input.address,
      referral: input.referral,
      notes: input.notes,
      subtotal_minor: input.subtotalMinor,
      membership_discount_minor: input.membershipDiscountMinor,
      total_minor: input.totalMinor,
      created_at: input.createdAt.toISOString(),
      items: input.items.map((item) => ({
        line_key: item.lineKey,
        name: item.name,
        size_label: item.sizeLabel,
        quantity: item.quantity,
        unit_price_minor: item.unitPriceMinor,
        line_total_minor: item.lineTotalMinor,
      })),
    });
    return raw.result;
  }

  async search(input: SearchCustomerOrdersInput): Promise<{ total: number; rows: CustomerOrderSummary[] }> {
    const raw = await this.call<{ total: number; rows: RawSummary[] }>("customer_orders_search", {
      query: input.query,
      status: input.status ?? null,
      limit: input.limit,
      offset: input.offset,
    });
    return { total: Number(raw.total), rows: raw.rows.map(mapSummary) };
  }

  async get(reference: string): Promise<CustomerOrderDetail | null> {
    const raw = await this.call<{
      order:
        | (RawSummary & {
            email: string | null;
            address: string;
            referral: string | null;
            notes: string | null;
            updated_at: string;
          })
        | null;
      items: RawItem[];
    }>("customer_order_get", { reference });
    if (!raw.order) return null;
    return {
      ...mapSummary(raw.order),
      email: raw.order.email,
      address: raw.order.address,
      referral: raw.order.referral,
      notes: raw.order.notes,
      updatedAt: new Date(raw.order.updated_at),
      items: raw.items.map(mapItem),
    };
  }

  /** Changes an order's status. The change and its audit entry are written in one transaction. */
  async setStatus(input: {
    reference: string;
    status: CustomerOrderStatus;
    actor: string;
    reason: string;
  }): Promise<CustomerOrderSummary> {
    const raw = await this.call<RawSummary>("customer_order_set_status", {
      reference: input.reference,
      status: input.status,
      actor: input.actor,
      reason: input.reason,
    });
    return mapSummary(raw);
  }
}
