import type {
  MembershipDisplayStatus,
  MembershipPaymentStatus,
  MembershipStatus,
  RedemptionStatus,
} from "@/types/membership";

export const DISPLAY_STATUS_LABELS: Record<MembershipDisplayStatus, string> = {
  none: "No membership",
  pending_payment: "Payment waiting",
  active: "Active",
  expired: "Expired",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

export const TERM_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  reserved: "Reserved, not yet fulfilled",
  consumed: "Fulfilled",
  released: "Released",
  restored: "Fully refunded",
};

export const PAYMENT_STATUS_LABELS: Record<MembershipPaymentStatus, string> = {
  awaiting_payment: "Awaiting payment",
  pending_verification: "Waiting for verification",
  verified: "Verified",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const PURPOSE_LABELS: Record<"new" | "renewal", string> = {
  new: "New membership",
  renewal: "Renewal",
};

/** Turns a stored audit action such as "term.corrected" into readable text. */
export function formatAuditAction(action: string): string {
  const words = action.replace(/[._]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
