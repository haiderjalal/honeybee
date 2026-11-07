import { logger } from "@/lib/logger";
import { rupeesToMinor } from "@/utils/money";

import type { CustomerOrderInput, CustomerOrderRepository } from "./customerOrder.repository";
import type { OrderRecorder, OrderRequest } from "./inquiry.types";

/** Converts a placed order into the stored form. Whole-rupee prices become paisa, and the total is checked. */
export function toCustomerOrderInput(order: OrderRequest): CustomerOrderInput {
  const subtotalMinor = rupeesToMinor(order.subtotal);
  const membershipDiscountMinor = order.membership?.discountMinor ?? 0;

  return {
    reference: order.reference,
    customerName: order.customer.name,
    phone: order.customer.phone,
    email: order.customer.email,
    city: order.customer.city,
    address: order.customer.address,
    referral: order.customer.referral,
    notes: order.customer.notes,
    subtotalMinor,
    membershipDiscountMinor,
    totalMinor: subtotalMinor - membershipDiscountMinor,
    createdAt: new Date(order.createdAt),
    items: order.lines.map((line) => ({
      lineKey: `${line.varietySlug}:${line.sizeId}`,
      name: line.name,
      sizeLabel: line.sizeLabel,
      quantity: line.quantity,
      unitPriceMinor: rupeesToMinor(line.unitPrice),
      lineTotalMinor: rupeesToMinor(line.lineTotal),
    })),
  };
}

/** Saves each placed order in the database, so the admin Orders tab can list and search it. */
export function createCustomerOrderRecorder(repo: CustomerOrderRepository): OrderRecorder {
  return {
    async record(order) {
      await repo.insert(toCustomerOrderInput(order));
    },
  };
}

/**
 * Runs several recorders for each order. One failing never stops the others, and the failure is logged with the
 * order reference, so the team can add the order by hand.
 */
export function combineOrderRecorders(recorders: readonly OrderRecorder[]): OrderRecorder {
  return {
    async record(order) {
      const results = await Promise.allSettled(recorders.map((recorder) => recorder.record(order)));
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.error("Order not recorded by one of the order logs; add it by hand", {
            reference: order.reference,
            recorder: index,
            error: result.reason,
          });
        }
      });
    },
  };
}
