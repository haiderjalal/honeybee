import { z } from "zod";
import type { ZodError } from "zod";

import { MEMBERSHIP } from "@/constants/membership";
import type { MembershipStatus } from "@/types/membership";

import {
  MAX_LINE_KEY_LENGTH,
  MAX_ORDER_REFERENCE_LENGTH,
  MAX_REASON_LENGTH,
  PAYMENT_REFERENCE_LENGTH,
} from "./adminConstants";
import { REFUND_FIELD_PREFIX } from "./adminFormFields";
import { parseMembershipDateTime } from "./adminTime";

/** Zod schemas for admin form input. Every value is untrusted: each action parses its input before use. */

const DEFAULT_FORM_MESSAGE = "Check the form and try again.";
const REASON_REQUIRED_MESSAGE = "Enter a reason. It is recorded in the audit log.";
const REASON_TOO_LONG_MESSAGE = `Keep the reason under ${MAX_REASON_LENGTH} characters.`;
const REFERENCE_MESSAGE = `Enter the bank or transfer reference (${PAYMENT_REFERENCE_LENGTH.min} to ${PAYMENT_REFERENCE_LENGTH.max} characters).`;
const VERIFY_CONFIRM_MESSAGE = "Tick the box to confirm you matched this transfer on the bank statement.";
const REFUND_CONFIRM_MESSAGE = "Tick the box to confirm the refund. A refund cannot be reversed.";
const EXPIRY_MESSAGE = "Enter a valid expiry date and time.";
const DISCOUNTS_USED_MESSAGE = `Enter a whole number from 0 to ${MEMBERSHIP.discountAllowance}.`;
const CHANGE_REQUIRED_MESSAGE = "Choose at least one change: a status, an expiry date or a discount count.";
const ORDER_REFERENCE_MESSAGE = "Enter an order reference.";
const QUANTITY_MESSAGE = "Refund quantities must be whole numbers.";

function blankToUndefined(value: string): string | undefined {
  return value === "" ? undefined : value;
}

function isWholeNumberUpTo(value: string, max: number): boolean {
  return /^\d+$/.test(value) && Number(value) <= max;
}

const optionalReasonSchema = z
  .string()
  .trim()
  .max(MAX_REASON_LENGTH, REASON_TOO_LONG_MESSAGE)
  .transform(blankToUndefined);

const requiredReasonSchema = z
  .string()
  .trim()
  .min(1, REASON_REQUIRED_MESSAGE)
  .max(MAX_REASON_LENGTH, REASON_TOO_LONG_MESSAGE);

export const verifyPaymentSchema = z.object({
  purchaseId: z.uuid("We couldn't find that membership payment."),
  providerReference: z
    .string()
    .trim()
    .min(PAYMENT_REFERENCE_LENGTH.min, REFERENCE_MESSAGE)
    .max(PAYMENT_REFERENCE_LENGTH.max, REFERENCE_MESSAGE),
  reason: optionalReasonSchema,
  confirmed: z.literal("yes", VERIFY_CONFIRM_MESSAGE),
});

const statusOrBlankSchema = z
  .enum(["", "active", "suspended", "cancelled"])
  .transform((value): MembershipStatus | undefined => (value === "" ? undefined : value));

const expiryOrBlankSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || parseMembershipDateTime(value) !== null, EXPIRY_MESSAGE)
  .transform((value): Date | undefined => (value === "" ? undefined : (parseMembershipDateTime(value) ?? undefined)));

const discountsUsedOrBlankSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || isWholeNumberUpTo(value, MEMBERSHIP.discountAllowance), DISCOUNTS_USED_MESSAGE)
  .transform((value): number | undefined => (value === "" ? undefined : Number(value)));

export const correctMemberTermSchema = z
  .object({
    termId: z.uuid("We couldn't find that membership."),
    status: statusOrBlankSchema,
    expiresAt: expiryOrBlankSchema,
    discountsUsed: discountsUsedOrBlankSchema,
    reason: requiredReasonSchema,
  })
  .refine(
    (data) => data.status !== undefined || data.expiresAt !== undefined || data.discountsUsed !== undefined,
    CHANGE_REQUIRED_MESSAGE,
  );

export const orderReferenceSchema = z.object({
  orderReference: z
    .string()
    .trim()
    .min(1, ORDER_REFERENCE_MESSAGE)
    .max(MAX_ORDER_REFERENCE_LENGTH, "That order reference is too long."),
});

export const refundOrderSchema = orderReferenceSchema.extend({
  confirmed: z.literal("yes", REFUND_CONFIRM_MESSAGE),
});

const refundLineSchema = z.object({
  lineKey: z.string().min(1).max(MAX_LINE_KEY_LENGTH),
  quantity: z
    .string()
    .trim()
    .regex(/^\d{0,4}$/, QUANTITY_MESSAGE)
    .transform((value) => (value === "" ? 0 : Number(value))),
});

export interface RefundLine {
  lineKey: string;
  quantity: number;
}

export type RefundLinesResult = { ok: true; lines: RefundLine[] } | { ok: false; message: string };

/** Reads every refund quantity from a form and keeps the lines that refund at least one jar. */
export function parseRefundLines(formData: FormData): RefundLinesResult {
  const lines: RefundLine[] = [];

  for (const [name, value] of formData.entries()) {
    if (!name.startsWith(REFUND_FIELD_PREFIX)) continue;

    const parsed = refundLineSchema.safeParse({
      lineKey: name.slice(REFUND_FIELD_PREFIX.length),
      quantity: typeof value === "string" ? value : "",
    });
    if (!parsed.success) return { ok: false, message: firstIssueMessage(parsed.error) };
    if (parsed.data.quantity > 0) lines.push(parsed.data);
  }

  return { ok: true, lines };
}

export function firstIssueMessage(error: ZodError): string {
  return error.issues[0]?.message ?? DEFAULT_FORM_MESSAGE;
}
