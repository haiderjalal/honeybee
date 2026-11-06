import { MembershipDbError } from "@/services/membership/membership.repository";
import { MembershipServiceError } from "@/services/membership/membership.service";

/** Plain-language messages for membership errors. Codes come from the services and the database rules. */
const MESSAGES: Record<string, string> = {
  sales_closed: "Membership sign-ups are not open yet.",
  invalid_phone: "Enter a valid Pakistani mobile number, such as 0300 1234567.",
  purchase_open: "You already have a membership payment waiting for verification.",
  already_active: "Your membership is still active, so there is nothing to renew yet.",
  membership_blocked: "Your membership is not available right now. Please contact us.",
  invalid_reference: "Enter the reference you used for the transfer (3 to 80 characters).",
  purchase_closed: "This membership payment is no longer open.",
  purchase_not_found: "We couldn't find that membership payment.",
  not_verified: "This payment has not been verified yet.",
  amount_mismatch: "The amount does not match the membership fee.",
  already_member: "This phone number or account already has a live membership term.",
  reference_already_used: "That bank reference has already verified another payment.",
  reason_required: "Enter a reason. It is recorded in the audit log.",
  redemption_not_found: "No member order matches that reference.",
  not_fulfilled: "Only fulfilled orders can be refunded. Mark the order fulfilled first.",
  already_refunded: "This order has already been fully refunded.",
  stale_redemption: "Someone changed this order just now. Reload and try again.",
  invalid_quantity: "Refund quantities must be whole numbers within what was ordered and not yet refunded.",
  unknown_line: "That jar is not on this order.",
  invalid_period: "The end date must be after the start date.",
  correction_invalid: "That correction would break a membership rule, such as the allowance.",
  correction_overlaps: "That expiry date would overlap another membership term.",
  term_not_found: "We couldn't find that membership.",
  allowance_used: "All six discounted orders for this term are already used.",
  term_not_active: "This membership is not active.",
  reminders_not_configured: "Reminders are not set up yet.",
  counter_invalid: "That change would break the discount allowance, so it was not saved.",
};

const FALLBACK = "Something went wrong with membership. Please try again, or contact the team if it continues.";

/** Maps any membership error to a message that is safe to show. Unknown errors never expose internal details. */
export function describeMembershipError(error: unknown): string {
  if (error instanceof MembershipServiceError || error instanceof MembershipDbError) {
    return MESSAGES[error.code] ?? FALLBACK;
  }
  return FALLBACK;
}
