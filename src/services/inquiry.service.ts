import { logger } from "@/lib/logger";
import { getPricedVariant } from "@/services/catalog.service";
import { normalizePhone, sanitizeLine, sanitizeMultiline } from "@/utils/text";

import type { CustomerInput, InquiryInput, InquiryItemInput } from "@/lib/validations/inquiry.schema";
import type {
  InquiryNotifier,
  InquiryResult,
  OrderCustomer,
  OrderLine,
  OrderRecorder,
  OrderRequest,
} from "./inquiry.types";

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

interface InquiryServiceDeps {
  notifier: InquiryNotifier;
  recorder?: OrderRecorder | null;
  now?: () => Date;
  createReference?: (now: Date) => string;
}

export interface SubmitOptions {
  /** Runs follow-up work after the response is sent (e.g. Next.js `after`). Defaults to awaiting it. */
  defer?: (work: Promise<void>) => void;
}

export function createOrderReference(now: Date, random: () => number = Math.random): string {
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = Math.floor(random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `HB-${datePart}-${randomPart}`;
}

/**
 * Turns a validated inquiry into an order request and delivers it.
 * Prices always come from the catalogue — client-sent prices are never trusted.
 */
export class InquiryService {
  private readonly notifier: InquiryNotifier;
  private readonly recorder: OrderRecorder | null;
  private readonly now: () => Date;
  private readonly createReference: (now: Date) => string;
  private readonly recent = new Map<string, { expiresAt: number; result: Promise<InquiryResult> }>();

  constructor({
    notifier,
    recorder = null,
    now = () => new Date(),
    createReference = createOrderReference,
  }: InquiryServiceDeps) {
    this.notifier = notifier;
    this.recorder = recorder;
    this.now = now;
    this.createReference = createReference;
  }

  submit(input: InquiryInput, options: SubmitOptions = {}): Promise<InquiryResult> {
    const nowMs = this.now().getTime();
    this.evictExpired(nowMs);

    // Prevent duplicate orders from double-clicks or network retries.
    const existing = this.recent.get(input.idempotencyKey);
    if (existing) return existing.result;

    const result = this.process(input, options.defer).then((outcome) => {
      // Failed deliveries may be retried with the same key.
      if (!outcome.ok) this.recent.delete(input.idempotencyKey);
      return outcome;
    });
    this.recent.set(input.idempotencyKey, { expiresAt: nowMs + IDEMPOTENCY_TTL_MS, result });
    return result;
  }

  private async process(input: InquiryInput, defer?: SubmitOptions["defer"]): Promise<InquiryResult> {
    const lines = this.priceLines(input.items);
    if (!lines) {
      return {
        ok: false,
        reason: "invalid_items",
        message: "Some jars in your hive are no longer available. Please review your hive.",
      };
    }

    const createdAt = this.now();
    const order: OrderRequest = {
      reference: this.createReference(createdAt),
      createdAt: createdAt.toISOString(),
      customer: this.normalizeCustomer(input),
      lines,
      subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    };

    try {
      await this.notifier.notifyOwner(order);
    } catch (error) {
      logger.error("Inquiry delivery to owner failed", { reference: order.reference, error });
      return {
        ok: false,
        reason: "delivery_failed",
        message: "We couldn't send your order request just now. Please try again in a moment.",
      };
    }

    logger.info("Inquiry submitted", { reference: order.reference, lines: lines.length, subtotal: order.subtotal });

    // The order is already with us, so these follow-ups never fail the request. When the caller can defer
    // work, the customer gets the answer without waiting for the confirmation email or the spreadsheet.
    const followUps = Promise.all([this.recordOrder(order), this.confirmCustomer(order)]).then(() => undefined);
    if (defer) defer(followUps);
    else await followUps;

    return { ok: true, reference: order.reference };
  }

  private async recordOrder(order: OrderRequest): Promise<void> {
    if (!this.recorder) return;
    try {
      await this.recorder.record(order);
    } catch (error) {
      logger.error("Order not written to the order sheet; add it by hand", { reference: order.reference, error });
    }
  }

  private async confirmCustomer(order: OrderRequest): Promise<void> {
    if (!order.customer.email) return;
    await this.notifier.notifyCustomer(order).catch((error: unknown) => {
      logger.warn("Customer confirmation email failed", { reference: order.reference, error });
    });
  }

  /** Merges duplicate lines and resolves authoritative prices. Returns null if any item is unknown. */
  private priceLines(items: InquiryItemInput[]): OrderLine[] | null {
    const merged = new Map<string, OrderLine>();

    for (const item of items) {
      const variant = getPricedVariant(item.varietySlug, item.sizeId);
      if (!variant) return null;

      const key = `${item.varietySlug}:${item.sizeId}`;
      const quantity = (merged.get(key)?.quantity ?? 0) + item.quantity;
      merged.set(key, {
        varietySlug: variant.variety.slug,
        sizeId: variant.size.id,
        name: variant.variety.name,
        sizeLabel: variant.size.label,
        quantity,
        unitPrice: variant.unitPrice,
        lineTotal: variant.unitPrice * quantity,
      });
    }
    return [...merged.values()];
  }

  private normalizeCustomer(input: CustomerInput): OrderCustomer {
    const email = input.email ? sanitizeLine(input.email).toLowerCase() : "";
    const notes = input.notes ? sanitizeMultiline(input.notes) : "";
    const referral = input.referral ? sanitizeLine(input.referral) : "";
    return {
      name: sanitizeLine(input.name),
      phone: normalizePhone(input.phone),
      email: email || null,
      city: sanitizeLine(input.city),
      address: sanitizeMultiline(input.address),
      referral: referral || null,
      notes: notes || null,
    };
  }

  private evictExpired(nowMs: number): void {
    for (const [key, entry] of this.recent) {
      if (entry.expiresAt <= nowMs) this.recent.delete(key);
    }
  }
}
