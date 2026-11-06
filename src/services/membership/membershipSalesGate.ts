import { MEMBERSHIP_LAUNCH, type MembershipLaunchFlags } from "@/constants/membership";

/**
 * Lists the launch requirements that are still open. Public membership sales stay closed until this list is empty.
 * The messages are for the team and the admin setup, not for customers.
 */
export function getMembershipSalesBlockers(launch: MembershipLaunchFlags = MEMBERSHIP_LAUNCH): string[] {
  const blockers: string[] = [];
  if (!launch.feeRefundPolicyPublished) {
    blockers.push("Membership-fee refund and cancellation policy has not been agreed and published.");
  }
  if (!launch.paymentRouteConfigured) {
    blockers.push("No membership payment route is configured (online provider or verified manual transfer).");
  }
  if (!launch.adminVerificationAvailable) {
    blockers.push("Admin verification of pending membership payments is not available yet.");
  }
  if (!launch.storageConfigured) {
    blockers.push("Membership storage has not been provisioned and migrated.");
  }
  return blockers;
}

export function isMembershipSalesOpen(launch: MembershipLaunchFlags = MEMBERSHIP_LAUNCH): boolean {
  return getMembershipSalesBlockers(launch).length === 0;
}
