import {
  MEMBERSHIP_BANK_TRANSFER,
  MEMBERSHIP_FEE_REFUND_POLICY,
  MEMBERSHIP_LAUNCH,
  type MembershipBankTransfer,
  type MembershipLaunchFlags,
} from "@/constants/membership";

/** Everything the sales gate reads: the policy and bank details from config, and the operational flags. */
export interface MembershipLaunchInputs extends MembershipLaunchFlags {
  refundPolicy: string | null;
  bankTransfer: MembershipBankTransfer | null;
}

export function getMembershipLaunchInputs(): MembershipLaunchInputs {
  return {
    ...MEMBERSHIP_LAUNCH,
    refundPolicy: MEMBERSHIP_FEE_REFUND_POLICY,
    bankTransfer: MEMBERSHIP_BANK_TRANSFER,
  };
}

/** An account is complete when the method, title and number are filled in. The IBAN is optional for wallets. */
function hasCompleteBankTransfer(account: MembershipBankTransfer | null): boolean {
  if (!account) return false;
  return [account.method, account.accountTitle, account.accountNumber].every((value) => value.trim() !== "");
}

/**
 * Lists the launch requirements that are still open. Public membership sales stay closed until this list is empty.
 * The messages are for the team and the admin setup, not for customers.
 */
export function getMembershipSalesBlockers(inputs: MembershipLaunchInputs = getMembershipLaunchInputs()): string[] {
  const blockers: string[] = [];
  if (!inputs.refundPolicy || inputs.refundPolicy.trim() === "") {
    blockers.push("Membership-fee refund and cancellation policy has not been agreed and published.");
  }
  if (!hasCompleteBankTransfer(inputs.bankTransfer)) {
    blockers.push("Bank transfer details for membership fees have not been confirmed.");
  }
  if (!inputs.adminVerificationAvailable) {
    blockers.push("Admin verification of pending membership payments is not available yet.");
  }
  if (!inputs.storageConfigured) {
    blockers.push("Membership storage has not been provisioned and migrated.");
  }
  return blockers;
}

export function isMembershipSalesOpen(inputs: MembershipLaunchInputs = getMembershipLaunchInputs()): boolean {
  return getMembershipSalesBlockers(inputs).length === 0;
}
