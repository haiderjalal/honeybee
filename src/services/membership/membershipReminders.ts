import { MEMBERSHIP } from "@/constants/membership";

import { MembershipServiceError } from "./membership.service";

import type { MembershipRepository, StoredTerm } from "./membership.repository";

/**
 * Renewal reminders for a term. Only the most urgent reminder due now is planned, so a customer never receives both
 * the 30-day and the 7-day reminder on the same day. Each reminder is claimed in the database before it is sent,
 * so repeated scheduler runs send it at most once.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type RenewalReminderKind = "renewal_30_days" | "renewal_7_days";

export interface PlannedRenewalReminder {
  kind: RenewalReminderKind;
  dedupeKey: string;
}

export function planRenewalReminder(input: {
  term: Pick<StoredTerm, "id" | "status" | "expiresAt">;
  now: Date;
  /** Reminder consent. Without it nothing is planned. */
  renewalRemindersEnabled: boolean;
}): PlannedRenewalReminder | null {
  const { term, now, renewalRemindersEnabled } = input;
  if (!renewalRemindersEnabled || term.status !== "active") return null;

  const millisecondsLeft = term.expiresAt.getTime() - now.getTime();
  if (millisecondsLeft <= 0) return null;

  const [longLeadDays, shortLeadDays] = MEMBERSHIP.renewalReminderDays;
  if (millisecondsLeft <= shortLeadDays * DAY_MS) {
    return { kind: "renewal_7_days", dedupeKey: `renewal_7_days:${term.id}` };
  }
  if (millisecondsLeft <= longLeadDays * DAY_MS) {
    return { kind: "renewal_30_days", dedupeKey: `renewal_30_days:${term.id}` };
  }
  return null;
}

/**
 * Sends a reminder through an existing messaging channel. Implementations must throw when they are not configured,
 * so nothing is ever sent by accident during development or tests.
 */
export interface RenewalReminderTransport {
  /** False until a channel is set up. Nothing is claimed or sent while this is false. */
  readonly configured: boolean;
  sendRenewalReminder(input: { customerUserId: string; kind: RenewalReminderKind; expiresAt: Date }): Promise<void>;
}

/** The default until a messaging channel is configured. It refuses every send. */
export class UnconfiguredReminderTransport implements RenewalReminderTransport {
  readonly configured = false;

  async sendRenewalReminder(): Promise<void> {
    throw new MembershipServiceError("reminders_not_configured");
  }
}

export interface ReminderDispatchResult {
  sent: number;
  skippedAlreadyClaimed: number;
  /** True when no channel is configured, so nothing was claimed or sent. */
  channelNotConfigured: boolean;
}

/** Plans, claims and sends the renewal reminders due for the given terms. */
export async function dispatchRenewalReminders(input: {
  repo: MembershipRepository;
  transport: RenewalReminderTransport;
  terms: readonly StoredTerm[];
  /** Whether a customer has consented to renewal reminders. */
  isRenewalReminderEnabled: (customerUserId: string) => Promise<boolean>;
  now: Date;
}): Promise<ReminderDispatchResult> {
  const result: ReminderDispatchResult = { sent: 0, skippedAlreadyClaimed: 0, channelNotConfigured: false };

  // Check the channel before claiming anything, so a missing setup never burns a reminder.
  if (!input.transport.configured) {
    result.channelNotConfigured = true;
    return result;
  }

  for (const term of input.terms) {
    const enabled = await input.isRenewalReminderEnabled(term.customerUserId);
    const planned = planRenewalReminder({ term, now: input.now, renewalRemindersEnabled: enabled });
    if (!planned) continue;

    const claimed = await input.repo.claimReminder({
      dedupeKey: planned.dedupeKey,
      termId: term.id,
      userId: term.customerUserId,
      kind: planned.kind,
      scheduledFor: input.now,
    });
    if (!claimed) {
      result.skippedAlreadyClaimed += 1;
      continue;
    }

    // At most once: the reminder is claimed before sending. A failed send is logged by the caller, not retried.
    await input.transport.sendRenewalReminder({
      customerUserId: term.customerUserId,
      kind: planned.kind,
      expiresAt: term.expiresAt,
    });
    result.sent += 1;
  }

  return result;
}
