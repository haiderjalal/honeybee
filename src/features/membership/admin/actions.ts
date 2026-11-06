"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/constants/routes";
import { describeMembershipError } from "@/features/membership/membershipErrorCopy";
import { logger } from "@/lib/logger";
import { MembershipDbError } from "@/services/membership/membership.repository";
import {
  correctMemberTerm,
  fulfilMemberOrder,
  MembershipServiceError,
  refundMemberOrder,
  releaseMemberOrder,
  verifyFeePayment,
} from "@/services/membership/membership.service";
import { formatPkrMinor } from "@/utils/formatPkr";

import { getAdminContext } from "./adminAccess";
import type { AdminActionState } from "./adminActionState";
import { REDEMPTION_STATUS_LABELS } from "./adminLabels";
import { ADMIN_FIELDS } from "./adminFormFields";
import {
  correctMemberTermSchema,
  firstIssueMessage,
  orderReferenceSchema,
  parseRefundLines,
  refundOrderSchema,
  verifyPaymentSchema,
} from "./adminSchemas";

/*
 * Every action checks the signed-in admin on the server before reading its input. Client-side hiding is not access
 * control. Errors are logged with the action name only and shown as the safe copy from describeMembershipError.
 */

/** Recorded in the audit log with the admin as the actor. Order actions have no free-text reason field yet. */
const ORDER_FULFILLED_REASON = "Order marked fulfilled by the admin team";
const RESERVATION_RELEASED_REASON = "Reservation released by the admin team";
const REFUND_REASON = "Refund recorded by the admin team";

type AdminActionName = "verifyPayment" | "correctTerm" | "fulfilOrder" | "releaseOrder" | "refundOrder";

type RefundOutcome = Awaited<ReturnType<typeof refundMemberOrder>>;

function ok(message: string): AdminActionState {
  return { status: "ok", message };
}

function fail(message: string): AdminActionState {
  return { status: "error", message };
}

function accessFailure(reason: "unavailable" | "forbidden"): AdminActionState {
  return fail(
    reason === "unavailable" ? "Membership admin isn't available yet." : "You don't have permission to do that.",
  );
}

function failure(action: AdminActionName, error: unknown): AdminActionState {
  const expected = error instanceof MembershipServiceError || error instanceof MembershipDbError;
  if (expected) {
    logger.warn("Membership admin action refused", { action, error });
  } else {
    logger.error("Membership admin action failed", { action, error });
  }
  return fail(describeMembershipError(error));
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function describeRefund(result: RefundOutcome): string {
  const scope = result.isFullRefund
    ? "Full refund: the discount allowance is restored to the original term. The term's dates do not change, and the term is not extended."
    : "Partial refund: the discount allowance is not restored.";
  return `Refunded ${formatPkrMinor(result.refundedPaidMinor)} paid for the returned jars. Reversed ${formatPkrMinor(result.reversedDiscountMinor)} of membership discount. ${scope}`;
}

export async function verifyPaymentAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const access = await getAdminContext();
  if (!access.ok) return accessFailure(access.reason);

  const input = verifyPaymentSchema.safeParse({
    purchaseId: readText(formData, ADMIN_FIELDS.purchaseId),
    providerReference: readText(formData, ADMIN_FIELDS.providerReference),
    reason: readText(formData, ADMIN_FIELDS.reason),
    confirmed: readText(formData, ADMIN_FIELDS.confirmed),
  });
  if (!input.success) return fail(firstIssueMessage(input.error));

  try {
    const outcome = await verifyFeePayment(access.context.repo, {
      purchaseId: input.data.purchaseId,
      providerReference: input.data.providerReference,
      actor: access.context.actor,
      reason: input.data.reason,
      now: new Date(),
    });
    revalidatePath(ROUTES.adminMembership);
    return ok(
      outcome.result === "activated"
        ? "Payment verified. The membership term is now active."
        : "This payment was already verified, so nothing changed.",
    );
  } catch (error) {
    return failure("verifyPayment", error);
  }
}

export async function correctMemberTermAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const access = await getAdminContext();
  if (!access.ok) return accessFailure(access.reason);

  const input = correctMemberTermSchema.safeParse({
    termId: readText(formData, ADMIN_FIELDS.termId),
    status: readText(formData, ADMIN_FIELDS.status),
    expiresAt: readText(formData, ADMIN_FIELDS.expiresAt),
    discountsUsed: readText(formData, ADMIN_FIELDS.discountsUsed),
    reason: readText(formData, ADMIN_FIELDS.reason),
  });
  if (!input.success) return fail(firstIssueMessage(input.error));

  try {
    await correctMemberTerm(access.context.repo, {
      termId: input.data.termId,
      actor: access.context.actor,
      reason: input.data.reason,
      status: input.data.status,
      expiresAt: input.data.expiresAt,
      discountsUsed: input.data.discountsUsed,
    });
    revalidatePath(ROUTES.adminMembership);
    return ok("Membership updated and recorded in the audit log.");
  } catch (error) {
    return failure("correctTerm", error);
  }
}

export async function fulfilOrderAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const access = await getAdminContext();
  if (!access.ok) return accessFailure(access.reason);

  const input = orderReferenceSchema.safeParse({
    orderReference: readText(formData, ADMIN_FIELDS.orderReference),
  });
  if (!input.success) return fail(firstIssueMessage(input.error));

  try {
    const status = await fulfilMemberOrder(access.context.repo, input.data.orderReference, {
      actor: access.context.actor,
      reason: ORDER_FULFILLED_REASON,
    });
    if (status !== "consumed") {
      return fail(`This order's status is "${REDEMPTION_STATUS_LABELS[status]}", so it cannot be marked fulfilled.`);
    }
    revalidatePath(ROUTES.adminMembership);
    return ok("Order marked fulfilled. Its discount now counts as used.");
  } catch (error) {
    return failure("fulfilOrder", error);
  }
}

export async function releaseOrderAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const access = await getAdminContext();
  if (!access.ok) return accessFailure(access.reason);

  const input = orderReferenceSchema.safeParse({
    orderReference: readText(formData, ADMIN_FIELDS.orderReference),
  });
  if (!input.success) return fail(firstIssueMessage(input.error));

  try {
    const status = await releaseMemberOrder(access.context.repo, input.data.orderReference, {
      actor: access.context.actor,
      reason: RESERVATION_RELEASED_REASON,
    });
    if (status === null) throw new MembershipServiceError("redemption_not_found");
    if (status !== "released") {
      return fail(
        `This order's status is "${REDEMPTION_STATUS_LABELS[status]}", so its reservation cannot be released.`,
      );
    }
    revalidatePath(ROUTES.adminMembership);
    return ok("Reservation released. The reserved discount is free again.");
  } catch (error) {
    return failure("releaseOrder", error);
  }
}

export async function refundOrderAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const access = await getAdminContext();
  if (!access.ok) return accessFailure(access.reason);

  const input = refundOrderSchema.safeParse({
    orderReference: readText(formData, ADMIN_FIELDS.orderReference),
    confirmed: readText(formData, ADMIN_FIELDS.confirmed),
  });
  if (!input.success) return fail(firstIssueMessage(input.error));

  const lines = parseRefundLines(formData);
  if (!lines.ok) return fail(lines.message);
  if (lines.lines.length === 0) return fail("Enter a quantity for at least one jar to refund.");

  try {
    const result = await refundMemberOrder(access.context.repo, {
      orderReference: input.data.orderReference,
      refund: lines.lines,
      audit: { actor: access.context.actor, reason: REFUND_REASON },
    });
    revalidatePath(ROUTES.adminMembership);
    return ok(describeRefund(result));
  } catch (error) {
    return failure("refundOrder", error);
  }
}
