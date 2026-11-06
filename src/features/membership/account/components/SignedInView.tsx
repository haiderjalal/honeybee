import { LogOut } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { signOutMember } from "@/features/membership/authActions";

import { AccountHeader } from "./AccountHeader";
import { MembershipStatusPanel } from "./MembershipStatusPanel";
import { OpenPurchasePanel } from "./OpenPurchasePanel";
import { OrderHistory } from "./OrderHistory";
import { ReminderPreferencesForm } from "./ReminderPreferencesForm";
import { StartMembershipPanel } from "./StartMembershipPanel";

import type { ReactElement } from "react";
import type { AccountView } from "@/services/membership/membership.service";

interface SignedInViewProps {
  email: string | null;
  view: AccountView;
  /** Read on the server from the sales gate, and passed down so the join button reflects it. */
  salesOpen: boolean;
}

/** The account for a signed-in customer. Every value shown comes from the membership service. */
export function SignedInView({ email, view, salesOpen }: SignedInViewProps): ReactElement {
  return (
    <section aria-labelledby="account-title" className="pt-32 pb-16">
      <Container className="flex max-w-4xl flex-col gap-8">
        <AccountHeader title="Your membership">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {email ? <p className="text-sm text-cream-500">Signed in as {email}</p> : null}
            <form action={signOutMember}>
              <Button type="submit" variant="secondary" size="sm">
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </AccountHeader>

        <MembershipStatusPanel
          status={view.status}
          term={view.term}
          allowance={view.allowance}
          savingsMinor={view.savingsMinor}
        />

        {view.openPurchase ? (
          <OpenPurchasePanel purchase={view.openPurchase} />
        ) : (
          <StartMembershipPanel
            decision={view.purchaseStart}
            expiresAt={view.term?.expiresAt ?? null}
            salesOpen={salesOpen}
          />
        )}

        <OrderHistory redemptions={view.redemptions} />

        <ReminderPreferencesForm preferences={view.reminderPreferences} />
      </Container>
    </section>
  );
}
