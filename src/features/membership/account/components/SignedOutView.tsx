import { Container } from "@/components/layout/Container";

import { ACCOUNT_COPY } from "../accountCopy";

import { AccountHeader } from "./AccountHeader";
import { AccountPanel } from "./AccountPanel";
import { FormMessage } from "./FormMessage";
import { SignInForm } from "./SignInForm";

import type { ReactElement } from "react";

interface SignedOutViewProps {
  /** True when a sign-in link was opened but could not be used (the confirm route redirects here with auth=failed). */
  signInFailed: boolean;
}

export function SignedOutView({ signInFailed }: SignedOutViewProps): ReactElement {
  return (
    <section aria-labelledby="account-title" className="pt-32 pb-16">
      <Container className="flex max-w-xl flex-col gap-8">
        <AccountHeader title="Your membership">
          <p className="text-lg text-cream-300">Sign in to see your term, discounted orders and reminder choices.</p>
        </AccountHeader>

        {signInFailed ? <FormMessage tone="error" message={ACCOUNT_COPY.signInFailed} /> : null}

        <AccountPanel id="sign-in-title" title="Sign in">
          <p className="text-cream-300">Enter your email and we&apos;ll send a one-time sign-in link.</p>
          <SignInForm />
        </AccountPanel>
      </Container>
    </section>
  );
}
