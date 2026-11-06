import { logger } from "@/lib/logger";
import { getMemberAccount } from "@/lib/membership/access";
import { describeMembershipError } from "@/features/membership/membershipErrorCopy";
import { getAccountView } from "@/services/membership/membership.service";

import type { AccountView } from "@/services/membership/membership.service";
import type { MembershipRepository } from "@/services/membership/membership.repository";

/** What the account page needs to render. Errors arrive already mapped to a safe message. */
export type MembershipAccountState =
  | { status: "signed_out" }
  | { status: "signed_in"; email: string | null; view: AccountView }
  | { status: "failed"; message: string };

/**
 * Loads the signed-in customer's membership view. Kept apart from the page so that no JSX is built inside the
 * try block: a render error is not caught there, so the page renders the result after this returns.
 */
export async function loadMembershipAccount(repo: MembershipRepository): Promise<MembershipAccountState> {
  try {
    const user = await getMemberAccount();
    if (!user) return { status: "signed_out" };

    const view = await getAccountView(repo, user.id, new Date());
    return { status: "signed_in", email: user.email, view };
  } catch (error) {
    logger.error("Membership account failed to load", { error });
    return { status: "failed", message: describeMembershipError(error) };
  }
}
