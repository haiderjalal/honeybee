import type { Metadata } from "next";
import type { ReactElement } from "react";

import { getMembershipRepository } from "@/lib/supabase/membershipRepository";
import { AccountLoadError, AccountUnavailable } from "@/features/membership/account/components/AccountFallbacks";
import { SignedInView } from "@/features/membership/account/components/SignedInView";
import { SignedOutView } from "@/features/membership/account/components/SignedOutView";
import { loadMembershipAccount } from "@/features/membership/account/loadMembershipAccount";
import { isMembershipSalesOpen } from "@/services/membership/membershipSalesGate";

export const metadata: Metadata = {
  title: "Your membership account",
  description: "Your membership status, discounted orders and reminder choices.",
  // Personal account pages must never appear in search results.
  robots: { index: false, follow: false },
};

interface MembershipAccountPageProps {
  searchParams: Promise<{ auth?: string | string[] }>;
}

export default async function MembershipAccountPage({
  searchParams,
}: MembershipAccountPageProps): Promise<ReactElement> {
  const { auth } = await searchParams;

  const repo = getMembershipRepository();
  if (!repo) return <AccountUnavailable />;

  const account = await loadMembershipAccount(repo);
  if (account.status === "failed") return <AccountLoadError message={account.message} />;
  if (account.status === "signed_out") return <SignedOutView signInFailed={auth === "failed"} />;

  return <SignedInView email={account.email} view={account.view} salesOpen={isMembershipSalesOpen()} />;
}
