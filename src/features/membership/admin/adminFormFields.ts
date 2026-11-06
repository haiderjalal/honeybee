/** Form field names shared by the admin actions and the client forms that post to them. */
export const ADMIN_FIELDS = {
  purchaseId: "purchaseId",
  providerReference: "providerReference",
  reason: "reason",
  confirmed: "confirmed",
  termId: "termId",
  status: "status",
  expiresAt: "expiresAt",
  discountsUsed: "discountsUsed",
  orderReference: "orderReference",
} as const;

/** Refund quantities are posted as `refund:<lineKey>`, so one form carries every jar on an order. */
export const REFUND_FIELD_PREFIX = "refund:";

export function refundFieldName(lineKey: string): string {
  return `${REFUND_FIELD_PREFIX}${lineKey}`;
}
