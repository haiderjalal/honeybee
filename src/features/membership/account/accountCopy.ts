import { MEMBERSHIP } from "@/constants/membership";
import { formatPkrMinor } from "@/utils/formatPkr";

import type { StoredRedemption } from "@/services/membership/membership.repository";
import type { MembershipDisplayStatus, RedemptionStatus } from "@/types/membership";

/** Membership dates are always shown in Pakistan time, the zone the term rules are written in. */
const accountDateFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium" });

export function formatAccountDate(date: Date): string {
  return accountDateFormatter.format(date);
}

export const FEE_TEXT = formatPkrMinor(MEMBERSHIP.feeMinor);
export const TERM_TEXT = `${MEMBERSHIP.termMonths}-month term`;

/** Length of the transfer reference. The membership service applies the same bounds when it stores the reference. */
export const REFERENCE_LENGTH = { min: 3, max: 80 } as const;

export const MEMBERSHIP_STATUS_COPY: Record<MembershipDisplayStatus, { label: string; summary: string }> = {
  none: {
    label: "Not a member yet",
    summary: `Join for ${FEE_TEXT} to get up to ${MEMBERSHIP.discountAllowance} discounted orders in a ${TERM_TEXT}.`,
  },
  pending_payment: {
    label: "Payment pending",
    summary: "Your membership starts once we have verified your payment.",
  },
  active: {
    label: "Active",
    summary: "Member discounts apply to eligible orders until your term ends.",
  },
  expired: {
    label: "Expired",
    summary: `Your term has ended. Renew for ${FEE_TEXT} to start a new ${TERM_TEXT}.`,
  },
  suspended: {
    label: "Suspended",
    summary: "Your membership is suspended, so member discounts are not available. Please contact us.",
  },
  cancelled: {
    label: "Cancelled",
    summary: "This membership has been cancelled. Please contact us.",
  },
};

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  reserved: "Reserved",
  consumed: "Fulfilled",
  released: "Released",
  restored: "Refunded in full",
};

export interface RedemptionDate {
  label: string;
  date: Date | null;
}

/** The date that matters for an order: when it was reserved, fulfilled, released or refunded. */
export function getRedemptionDate(redemption: StoredRedemption): RedemptionDate {
  switch (redemption.status) {
    case "reserved":
      return { label: "Reserved on", date: redemption.reservedAt };
    case "consumed":
      return { label: "Fulfilled on", date: redemption.consumedAt };
    case "released":
      return { label: "Released on", date: redemption.releasedAt };
    case "restored":
      return { label: "Refunded on", date: redemption.restoredAt };
  }
}

/** Messages shown to the customer. Never built from error text. */
export const ACCOUNT_COPY = {
  unavailable: "Membership accounts aren't available yet.",
  signInRequired: "Sign in to manage your membership.",
  signInFailed: "That sign-in link didn't work. It may have expired or already been used. Request a new one.",
  invalidInput: "Check the details you entered and try again.",
  invalidPhone: "Enter a valid Pakistani mobile number, such as 0300 1234567.",
  invalidReference: `Enter the reference you used for the transfer (${REFERENCE_LENGTH.min} to ${REFERENCE_LENGTH.max} characters).`,
  purchaseNotFound: "We couldn't find that membership payment. Refresh the page and try again.",
  paymentStarted: "Your membership payment is ready. Follow the steps below.",
  referenceSubmitted: "Thanks. We're checking your payment, and your membership starts once it is verified.",
  remindersSaved: "Your reminder choices are saved.",
} as const;
