import { logger } from "@/lib/logger";
import { getPricedVariant } from "@/services/catalog.service";
import { normalizePhone, sanitizeLine, sanitizeMultiline } from "@/utils/text";

import type { CustomerInput, InquiryInput, InquiryItemInput } from "@/lib/validations/inquiry.schema";
import type { InquiryNotifier, InquiryResult, OrderCustomer, OrderLine, OrderRequest } from "./inquiry.types";

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

interface InquiryServiceDeps {
  notifier: InquiryNotifier;
  now?: () => Date;
  createReference?: (now: Date) => string;
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
  private readonly now: () => Date;
  private readonly createReference: (now: Date) => string;
  private readonly recent = new Map<string, { expiresAt: number; result: Promise<InquiryResult> }>();

  constructor({ notifier, now = () => new Date(), createReference = createOrderReference }: InquiryServiceDeps) {
    this.notifier = notifier;
    this.now = now;
    this.createReference = createReference;
  }

  submit(input: InquiryInput): Promise<InquiryResult> {
    const nowMs = this.now().getTime();
    this.evictExpired(nowMs);

    // Prevent duplicate orders from double-clicks or network retries.
    const existing = this.recent.get(input.idempotencyKey);
    if (existing) return existing.result;

    const result = this.process(input).then((outcome) => {
      // Failed deliveries may be retried with the same key.
      if (!outcome.ok) this.recent.delete(input.idempotencyKey);
      return outcome;
    });
    this.recent.set(input.idempotencyKey, { expiresAt: nowMs + IDEMPOTENCY_TTL_MS, result });
    return result;
  }

  private async process(input: InquiryInput): Promise<InquiryResult> {
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

    if (order.customer.email) {
      // The order is already with us; a failed confirmation email must not fail the request.
      await this.notifier.notifyCustomer(order).catch((error: unknown) => {
        logger.warn("Customer confirmation email failed", { reference: order.reference, error });
      });
    }

    return { ok: true, reference: order.reference };
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
    return {
      name: sanitizeLine(input.name),
      phone: normalizePhone(input.phone),
      email: email || null,
      city: sanitizeLine(input.city),
      address: sanitizeMultiline(input.address),
      notes: notes || null,
    };
  }

  private evictExpired(nowMs: number): void {
    for (const [key, entry] of this.recent) {
      if (entry.expiresAt <= nowMs) this.recent.delete(key);
    }
  }
}
