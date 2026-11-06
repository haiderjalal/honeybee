import type { MembershipRepository } from "./membership.repository";
import type { OrderLine, OrderMembershipPort } from "@/services/inquiry.types";

import { getListPrice, getVarietyBySlug } from "@/services/catalog.service";
import { rupeesToMinor } from "@/utils/money";

import {
  releaseMemberOrder,
  reserveMemberDiscount,
  type AuditContext,
  type OrderDiscountLine,
} from "./membership.service";

/** Audit entry for a reservation released because the order could not be delivered. */
const CHECKOUT_RELEASE_AUDIT: AuditContext = {
  actor: "system:checkout",
  reason: "Order could not be delivered, so its member discount was released",
};

/** Converts priced order lines into the lines the membership rules need. Sale status comes from the catalogue. */
export function toDiscountLines(lines: readonly OrderLine[]): OrderDiscountLine[] {
  return lines.map((line) => {
    const variety = getVarietyBySlug(line.varietySlug);
    const onSale = variety ? getListPrice(variety, line.sizeId) !== null : false;
    return {
      lineKey: `${line.varietySlug}:${line.sizeId}`,
      quantity: line.quantity,
      lineTotalMinor: rupeesToMinor(line.lineTotal),
      onSale,
    };
  });
}

/** Connects order creation to the membership rules and the database. */
export function createOrderMembershipPort(repo: MembershipRepository): OrderMembershipPort {
  return {
    async reserve({ customerUserId, orderReference, lines, now }) {
      const outcome = await reserveMemberDiscount(repo, {
        customerUserId,
        orderReference,
        lines: toDiscountLines(lines),
        now,
      });
      if (!outcome.reserved || outcome.choice.kind !== "membership") return null;
      return { discountMinor: outcome.choice.discountMinor };
    },
    async release(orderReference) {
      await releaseMemberOrder(repo, orderReference, CHECKOUT_RELEASE_AUDIT);
    },
  };
}
