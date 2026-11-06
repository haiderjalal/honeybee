import { MEMBERSHIP } from "@/constants/membership";

import type { MembershipDisplayStatus, MembershipTerm } from "@/types/membership";

export interface TermWindow {
  startsAt: Date;
  expiresAt: Date;
}

const LOCAL_OFFSET_MS = MEMBERSHIP.termUtcOffsetMinutes * 60_000;

/**
 * Adds calendar months in the membership's local time zone, so expiry lands on the same wall-clock time a term
 * later. A day that does not exist in the target month (29 February) becomes that month's last day.
 */
export function addCalendarMonths(instant: Date, months: number): Date {
  const local = new Date(instant.getTime() + LOCAL_OFFSET_MS);
  const firstOfTarget = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + months, 1));
  const year = firstOfTarget.getUTCFullYear();
  const month = firstOfTarget.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(local.getUTCDate(), lastDay);

  const shifted = Date.UTC(
    year,
    month,
    day,
    local.getUTCHours(),
    local.getUTCMinutes(),
    local.getUTCSeconds(),
    local.getUTCMilliseconds(),
  );
  return new Date(shifted - LOCAL_OFFSET_MS);
}

/** A term starts at verified activation and runs for the configured number of calendar months. */
export function getTermWindow(activatedAt: Date): TermWindow {
  return { startsAt: activatedAt, expiresAt: addCalendarMonths(activatedAt, MEMBERSHIP.termMonths) };
}

/**
 * Valid from the start instant up to, but not including, the expiry instant. The exact expiry moment is already
 * expired, so a term never grants a benefit after its end.
 */
export function isWithinTerm(window: TermWindow, now: Date): boolean {
  const nowMs = now.getTime();
  return nowMs >= window.startsAt.getTime() && nowMs < window.expiresAt.getTime();
}

/**
 * The status a customer or admin sees. An open fee purchase with no current term shows as pending, so a customer
 * who has paid but is awaiting verification is never shown as expired or inactive.
 */
export function getMembershipDisplayStatus(
  term: MembershipTerm | null,
  now: Date,
  hasOpenPurchase = false,
): MembershipDisplayStatus {
  if (term?.status === "suspended") return "suspended";
  if (term?.status === "cancelled") return "cancelled";
  if (term && isWithinTerm(term, now)) return "active";
  if (hasOpenPurchase) return "pending_payment";
  return term ? "expired" : "none";
}
