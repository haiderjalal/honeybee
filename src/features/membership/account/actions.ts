"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/constants/routes";
import { logger } from "@/lib/logger";
import { getMemberAccount } from "@/lib/membership/access";
import { getMembershipRepository } from "@/lib/supabase/membershipRepository";
import { describeMembershipError } from "@/features/membership/membershipErrorCopy";
import { startFeePurchase, submitPaymentReference } from "@/services/membership/membership.service";

import { ACCOUNT_COPY } from "./accountCopy";
import { feePurchaseSchema, getFirstIssueMessage, paymentReferenceSchema } from "./accountSchemas";

import type { AccountActionState } from "./accountActionState";
import type { MembershipRepository } from "@/services/membership/membership.repository";

interface MemberContext {
  userId: string;
  repo: MembershipRepository;
}

function errorState(message: string): AccountActionState {
  return { status: "error", message };
}

/**
 * Runs a member action after re-checking the signed-in user on the server. The user id always comes from the
 * session, never from the form, so a customer can only act on their own membership.
 */
async function runMemberAction(
  operation: (member: MemberContext) => Promise<void>,
  successMessage: string,
): Promise<AccountActionState> {
  try {
    const repo = getMembershipRepository();
    if (!repo) return errorState(ACCOUNT_COPY.unavailable);

    const user = await getMemberAccount();
    if (!user) return errorState(ACCOUNT_COPY.signInRequired);

    await operation({ userId: user.id, repo });
  } catch (error) {
    logger.error("Membership account action failed", { error });
    return errorState(describeMembershipError(error));
  }

  revalidatePath(ROUTES.membershipAccount);
  return { status: "success", message: successMessage };
}

/** Starts a new membership or a renewal, which creates a payment waiting for the customer's transfer. */
export async function startFeePurchaseAction(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = feePurchaseSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) return errorState(getFirstIssueMessage(parsed.error));

  const phone = parsed.data.phone;
  return runMemberAction(async ({ userId, repo }) => {
    await startFeePurchase(repo, { userId, phone, now: new Date() });
  }, ACCOUNT_COPY.paymentStarted);
}

/** Stores the transfer reference the customer gives. This only queues the payment for checking; nothing activates. */
export async function submitPaymentReferenceAction(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = paymentReferenceSchema.safeParse({
    purchaseId: formData.get("purchaseId"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) return errorState(getFirstIssueMessage(parsed.error));

  const { purchaseId, reference } = parsed.data;
  return runMemberAction(async ({ userId, repo }) => {
    await submitPaymentReference(repo, { userId, purchaseId, reference });
  }, ACCOUNT_COPY.referenceSubmitted);
}

/** Saves the reminder choices. Unticking a box withdraws consent for that reminder. */
export async function saveReminderPreferencesAction(
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const preferences = {
    renewalReminders: formData.get("renewalReminders") === "on",
    reorderReminders: formData.get("reorderReminders") === "on",
  };

  return runMemberAction(async ({ userId, repo }) => {
    await repo.savePreferences(userId, preferences);
  }, ACCOUNT_COPY.remindersSaved);
}
