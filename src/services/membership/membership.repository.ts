import type { MembershipPaymentStatus, MembershipStatus, MembershipTerm, RedemptionStatus } from "@/types/membership";

/**
 * Data access for membership. Each method calls one database RPC with a single jsonb payload, so the same code runs
 * against Supabase RPC in production and against embedded Postgres in tests. Business rules live in the services.
 */

/** Calls a membership RPC by name. Supabase's client and the test database both fit this shape. */
export type RpcCaller = (name: string, payload: Record<string, unknown>) => Promise<unknown>;

/** A rule refused the change. `code` is the part after "membership: " in the database error, e.g. "allowance_used". */
export class MembershipDbError extends Error {
  constructor(readonly code: string) {
    super(`membership: ${code}`);
    this.name = "MembershipDbError";
  }
}

const CODE_PATTERN = /membership: ([a-z_]+)/;

function toDbError(error: unknown): unknown {
  const message = error instanceof Error ? error.message : String(error);
  const match = CODE_PATTERN.exec(message);
  return match ? new MembershipDbError(match[1]) : error;
}

export interface StoredTerm extends MembershipTerm {
  customerUserId: string;
  phone: string;
  feeMinor: number;
  discountRateBps: number;
  maxDiscountPerOrderMinor: number;
  minEligibleSubtotalMinor: number;
}

export interface StoredPurchase {
  id: string;
  customerUserId: string;
  phone: string;
  purpose: "new" | "renewal";
  status: MembershipPaymentStatus;
  amountMinor: number;
  customerReference: string | null;
  termId: string | null;
  createdAt: Date;
  verifiedAt: Date | null;
}

export interface StoredRedemption {
  id: string;
  termId: string;
  orderReference: string;
  status: RedemptionStatus;
  eligibleSubtotalMinor: number;
  discountMinor: number;
  reversedDiscountMinor: number;
  refundedPaidMinor: number;
  reservedAt: Date;
  consumedAt: Date | null;
  releasedAt: Date | null;
  restoredAt: Date | null;
}

export interface StoredRedemptionLine {
  lineKey: string;
  quantity: number;
  refundedQuantity: number;
  lineTotalMinor: number;
  discountMinor: number;
}

export interface AccountPurchaseSummary {
  id: string;
  status: MembershipPaymentStatus;
  purpose: "new" | "renewal";
  amountMinor: number;
  createdAt: Date;
  verifiedAt: Date | null;
  termId: string | null;
}

export interface ReminderPreferences {
  renewalReminders: boolean;
  reorderReminders: boolean;
}

export interface AccountSnapshot {
  terms: StoredTerm[];
  purchases: AccountPurchaseSummary[];
  redemptions: StoredRedemption[];
  reminderPreferences: ReminderPreferences;
}

export interface PendingPayment {
  id: string;
  customerUserId: string;
  phone: string;
  purpose: "new" | "renewal";
  amountMinor: number;
  customerReference: string | null;
  createdAt: Date;
}

export interface AuditEvent {
  actor: string;
  action: string;
  reason: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  createdAt: Date;
}

export interface TermDetail {
  term: StoredTerm;
  redemptions: StoredRedemption[];
  purchases: StoredPurchase[];
  audit: AuditEvent[];
}

export interface ReportTotals {
  feesCollectedMinor: number;
  feePayments: number;
  discountsReservedMinor: number;
  discountsGrantedMinor: number;
  discountsReversedMinor: number;
  netDiscountCostMinor: number;
  memberOrdersFulfilled: number;
  memberOrdersPending: number;
  memberOrdersReleased: number;
  refundsMinor: number;
  refundedOrders: number;
}

/* Raw rows as the database returns them (snake_case, ISO date strings). */

interface RawTerm {
  id: string;
  customer_user_id: string;
  phone: string;
  status: MembershipStatus;
  starts_at: string;
  expires_at: string;
  fee_minor: number;
  discount_allowance: number;
  discount_rate_bps: number;
  max_discount_per_order_minor: number;
  min_eligible_subtotal_minor: number;
  discounts_used: number;
  discounts_reserved: number;
}

interface RawPurchase {
  id: string;
  customer_user_id: string;
  phone: string;
  purpose: "new" | "renewal";
  status: MembershipPaymentStatus;
  amount_minor: number;
  customer_reference: string | null;
  term_id: string | null;
  created_at: string;
  verified_at: string | null;
}

interface RawRedemption {
  id: string;
  term_id: string;
  order_reference: string;
  status: RedemptionStatus;
  eligible_subtotal_minor: number;
  discount_minor: number;
  reversed_discount_minor: number;
  refunded_paid_minor: number;
  reserved_at: string;
  consumed_at: string | null;
  released_at: string | null;
  restored_at: string | null;
}

interface RawLine {
  line_key: string;
  quantity: number;
  refunded_quantity: number;
  line_total_minor: number;
  discount_minor: number;
}

const toDate = (value: string): Date => new Date(value);
const toNullableDate = (value: string | null): Date | null => (value ? new Date(value) : null);

function mapTerm(raw: RawTerm): StoredTerm {
  return {
    id: raw.id,
    customerUserId: raw.customer_user_id,
    phone: raw.phone,
    status: raw.status,
    startsAt: toDate(raw.starts_at),
    expiresAt: toDate(raw.expires_at),
    feeMinor: raw.fee_minor,
    discountAllowance: raw.discount_allowance,
    discountRateBps: raw.discount_rate_bps,
    maxDiscountPerOrderMinor: raw.max_discount_per_order_minor,
    minEligibleSubtotalMinor: raw.min_eligible_subtotal_minor,
    discountsUsed: raw.discounts_used,
    discountsReserved: raw.discounts_reserved,
  };
}

function mapPurchase(raw: RawPurchase): StoredPurchase {
  return {
    id: raw.id,
    customerUserId: raw.customer_user_id,
    phone: raw.phone,
    purpose: raw.purpose,
    status: raw.status,
    amountMinor: raw.amount_minor,
    customerReference: raw.customer_reference,
    termId: raw.term_id,
    createdAt: toDate(raw.created_at),
    verifiedAt: toNullableDate(raw.verified_at),
  };
}

function mapRedemption(raw: RawRedemption): StoredRedemption {
  return {
    id: raw.id,
    termId: raw.term_id,
    orderReference: raw.order_reference,
    status: raw.status,
    eligibleSubtotalMinor: raw.eligible_subtotal_minor,
    discountMinor: raw.discount_minor,
    reversedDiscountMinor: raw.reversed_discount_minor,
    refundedPaidMinor: raw.refunded_paid_minor,
    reservedAt: toDate(raw.reserved_at),
    consumedAt: toNullableDate(raw.consumed_at),
    releasedAt: toNullableDate(raw.released_at),
    restoredAt: toNullableDate(raw.restored_at),
  };
}

function mapLine(raw: RawLine): StoredRedemptionLine {
  return {
    lineKey: raw.line_key,
    quantity: raw.quantity,
    refundedQuantity: raw.refunded_quantity,
    lineTotalMinor: raw.line_total_minor,
    discountMinor: raw.discount_minor,
  };
}

export interface VerifyPaymentInput {
  purchaseId: string;
  provider: string;
  providerReference: string;
  amountMinor: number;
  actor: string;
  reason: string;
  startsAt: Date;
  expiresAt: Date;
  rules: {
    feeMinor: number;
    discountAllowance: number;
    discountRateBps: number;
    maxDiscountPerOrderMinor: number;
    minEligibleSubtotalMinor: number;
  };
}

export interface ReserveRedemptionInput {
  termId: string;
  orderReference: string;
  eligibleSubtotalMinor: number;
  discountMinor: number;
  lines: { lineKey: string; quantity: number; lineTotalMinor: number; discountMinor: number }[];
}

export interface ApplyRedemptionChangeInput {
  orderReference: string;
  expectedStatus: RedemptionStatus;
  newStatus: RedemptionStatus;
  usedDelta: number;
  reservedDelta: number;
  expectedReversedMinor: number;
  newReversedMinor: number;
  expectedRefundedMinor: number;
  newRefundedMinor: number;
  /** New refunded quantity per line, written only when a refund changes it. */
  lineRefunds?: { lineKey: string; refundedQuantity: number }[];
  /** Who made the change. Written to the audit log in the same transaction. */
  actor: string;
  reason: string;
  auditAction: string;
}

export interface CorrectTermInput {
  termId: string;
  actor: string;
  reason: string;
  status?: MembershipStatus;
  expiresAt?: Date;
  discountsUsed?: number;
}

export class MembershipRepository {
  constructor(private readonly rpc: RpcCaller) {}

  private async call<T>(name: string, payload: Record<string, unknown>): Promise<T> {
    try {
      return (await this.rpc(name, payload)) as T;
    } catch (error) {
      throw toDbError(error);
    }
  }

  async getAccountSnapshot(userId: string): Promise<AccountSnapshot> {
    const raw = await this.call<{
      terms: RawTerm[];
      payments: {
        id: string;
        status: MembershipPaymentStatus;
        purpose: "new" | "renewal";
        amount_minor: number;
        created_at: string;
        verified_at: string | null;
        term_id: string | null;
      }[];
      redemptions: RawRedemption[];
      reminder_preferences: { renewal_reminders: boolean; reorder_reminders: boolean } | null;
    }>("membership_account_snapshot", { user_id: userId });

    return {
      terms: raw.terms.map(mapTerm),
      purchases: raw.payments.map((payment) => ({
        id: payment.id,
        status: payment.status,
        purpose: payment.purpose,
        amountMinor: payment.amount_minor,
        createdAt: toDate(payment.created_at),
        verifiedAt: toNullableDate(payment.verified_at),
        termId: payment.term_id,
      })),
      redemptions: raw.redemptions.map(mapRedemption),
      reminderPreferences: {
        renewalReminders: raw.reminder_preferences?.renewal_reminders ?? false,
        reorderReminders: raw.reminder_preferences?.reorder_reminders ?? false,
      },
    };
  }

  async createPurchase(input: { userId: string; phone: string; purpose: "new" | "renewal"; amountMinor: number }) {
    const raw = await this.call<RawPurchase>("membership_create_purchase", {
      user_id: input.userId,
      phone: input.phone,
      purpose: input.purpose,
      amount_minor: input.amountMinor,
    });
    return mapPurchase(raw);
  }

  async submitReference(input: { userId: string; purchaseId: string; reference: string }) {
    const raw = await this.call<RawPurchase>("membership_submit_reference", {
      user_id: input.userId,
      purchase_id: input.purchaseId,
      reference: input.reference,
    });
    return mapPurchase(raw);
  }

  async findPurchase(purchaseId: string): Promise<{ purchase: StoredPurchase; customerTerms: StoredTerm[] } | null> {
    const raw = await this.call<{ purchase: RawPurchase | null; customer_terms: RawTerm[] }>(
      "membership_find_purchase",
      { purchase_id: purchaseId },
    );
    if (!raw.purchase) return null;
    return { purchase: mapPurchase(raw.purchase), customerTerms: raw.customer_terms.map(mapTerm) };
  }

  async verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<{ result: "activated" | "already_activated"; termId: string }> {
    const raw = await this.call<{ result: "activated" | "already_activated"; term_id: string }>(
      "membership_verify_payment",
      {
        purchase_id: input.purchaseId,
        provider: input.provider,
        provider_reference: input.providerReference,
        amount_minor: input.amountMinor,
        actor: input.actor,
        reason: input.reason,
        starts_at: input.startsAt.toISOString(),
        expires_at: input.expiresAt.toISOString(),
        fee_minor: input.rules.feeMinor,
        discount_allowance: input.rules.discountAllowance,
        discount_rate_bps: input.rules.discountRateBps,
        max_discount_per_order_minor: input.rules.maxDiscountPerOrderMinor,
        min_eligible_subtotal_minor: input.rules.minEligibleSubtotalMinor,
      },
    );
    return { result: raw.result, termId: raw.term_id };
  }

  async reserveRedemption(input: ReserveRedemptionInput) {
    const raw = await this.call<{ result: "reserved" | "existing"; redemption_id: string; status: RedemptionStatus }>(
      "membership_reserve_redemption",
      {
        term_id: input.termId,
        order_reference: input.orderReference,
        eligible_subtotal_minor: input.eligibleSubtotalMinor,
        discount_minor: input.discountMinor,
        lines: input.lines.map((line) => ({
          line_key: line.lineKey,
          quantity: line.quantity,
          line_total_minor: line.lineTotalMinor,
          discount_minor: line.discountMinor,
        })),
      },
    );
    return { result: raw.result, redemptionId: raw.redemption_id, status: raw.status };
  }

  async findRedemption(
    orderReference: string,
  ): Promise<{ redemption: StoredRedemption; lines: StoredRedemptionLine[] } | null> {
    const raw = await this.call<{ redemption: RawRedemption | null; lines: RawLine[] }>("membership_find_redemption", {
      order_reference: orderReference,
    });
    if (!raw.redemption) return null;
    return { redemption: mapRedemption(raw.redemption), lines: raw.lines.map(mapLine) };
  }

  async applyRedemptionChange(input: ApplyRedemptionChangeInput): Promise<RedemptionStatus> {
    const raw = await this.call<{ status: RedemptionStatus }>("membership_apply_redemption_change", {
      order_reference: input.orderReference,
      expected_status: input.expectedStatus,
      new_status: input.newStatus,
      used_delta: input.usedDelta,
      reserved_delta: input.reservedDelta,
      expected_reversed_minor: input.expectedReversedMinor,
      new_reversed_minor: input.newReversedMinor,
      expected_refunded_minor: input.expectedRefundedMinor,
      new_refunded_minor: input.newRefundedMinor,
      line_refunds: (input.lineRefunds ?? []).map((line) => ({
        line_key: line.lineKey,
        refunded_quantity: line.refundedQuantity,
      })),
      actor: input.actor,
      reason: input.reason,
      audit_action: input.auditAction,
    });
    return raw.status;
  }

  async correctTerm(input: CorrectTermInput): Promise<StoredTerm> {
    const raw = await this.call<RawTerm>("membership_admin_correct_term", {
      term_id: input.termId,
      actor: input.actor,
      reason: input.reason,
      status: input.status,
      expires_at: input.expiresAt?.toISOString(),
      discounts_used: input.discountsUsed,
    });
    return mapTerm(raw);
  }

  async searchTerms(query: string, limit = 50): Promise<StoredTerm[]> {
    const raw = await this.call<RawTerm[]>("membership_admin_search_terms", { query, limit });
    return raw.map(mapTerm);
  }

  async getTermDetail(termId: string): Promise<TermDetail | null> {
    const raw = await this.call<{
      term: RawTerm | null;
      redemptions: RawRedemption[];
      payments: RawPurchase[];
      audit: {
        actor: string;
        action: string;
        reason: string;
        before_state: Record<string, unknown> | null;
        after_state: Record<string, unknown> | null;
        created_at: string;
      }[];
    }>("membership_admin_term_detail", { term_id: termId });

    if (!raw.term) return null;
    return {
      term: mapTerm(raw.term),
      redemptions: raw.redemptions.map(mapRedemption),
      purchases: raw.payments.map(mapPurchase),
      audit: raw.audit.map((event) => ({
        actor: event.actor,
        action: event.action,
        reason: event.reason,
        beforeState: event.before_state,
        afterState: event.after_state,
        createdAt: toDate(event.created_at),
      })),
    };
  }

  async listPendingPayments(): Promise<PendingPayment[]> {
    const raw = await this.call<
      {
        id: string;
        customer_user_id: string;
        phone: string;
        purpose: "new" | "renewal";
        amount_minor: number;
        customer_reference: string | null;
        created_at: string;
      }[]
    >("membership_admin_pending_payments", {});
    return raw.map((row) => ({
      id: row.id,
      customerUserId: row.customer_user_id,
      phone: row.phone,
      purpose: row.purpose,
      amountMinor: row.amount_minor,
      customerReference: row.customer_reference,
      createdAt: toDate(row.created_at),
    }));
  }

  async getReport(from: Date, to: Date): Promise<ReportTotals> {
    const raw = await this.call<Record<string, number>>("membership_report", {
      from: from.toISOString(),
      to: to.toISOString(),
    });
    return {
      feesCollectedMinor: raw.fees_collected_minor,
      feePayments: raw.fee_payments,
      discountsReservedMinor: raw.discounts_reserved_minor,
      discountsGrantedMinor: raw.discounts_granted_minor,
      discountsReversedMinor: raw.discounts_reversed_minor,
      netDiscountCostMinor: raw.net_discount_cost_minor,
      memberOrdersFulfilled: raw.member_orders_fulfilled,
      memberOrdersPending: raw.member_orders_pending,
      memberOrdersReleased: raw.member_orders_released,
      refundsMinor: raw.refunds_minor,
      refundedOrders: raw.refunded_orders,
    };
  }

  async savePreferences(userId: string, preferences: ReminderPreferences): Promise<void> {
    await this.call("membership_save_reminder_preferences", {
      user_id: userId,
      renewal_reminders: preferences.renewalReminders,
      reorder_reminders: preferences.reorderReminders,
    });
  }

  /** Records a reminder before it is sent. Returns false when the same reminder was already claimed. */
  async claimReminder(input: {
    dedupeKey: string;
    termId: string | null;
    userId: string;
    kind: "renewal_30_days" | "renewal_7_days" | "reorder";
    scheduledFor: Date;
  }): Promise<boolean> {
    const raw = await this.call<{ claimed: boolean }>("membership_claim_reminder", {
      dedupe_key: input.dedupeKey,
      term_id: input.termId ?? "",
      user_id: input.userId,
      kind: input.kind,
      channel: "email",
      scheduled_for: input.scheduledFor.toISOString(),
    });
    return raw.claimed;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const raw = await this.call<{ admin: boolean }>("membership_is_admin", { user_id: userId });
    return raw.admin;
  }
}
