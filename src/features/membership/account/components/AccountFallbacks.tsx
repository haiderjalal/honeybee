import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

import { ACCOUNT_COPY } from "../accountCopy";

import { AccountHeader } from "./AccountHeader";
import { FormMessage } from "./FormMessage";

import type { ReactElement } from "react";

/** Shown when membership storage is not configured. No sign-in form is offered in this state. */
export function AccountUnavailable(): ReactElement {
  return (
    <section aria-labelledby="account-title" className="pt-32 pb-16">
      <Container className="flex max-w-xl flex-col gap-8">
        <AccountHeader title={ACCOUNT_COPY.unavailable} />
        <ButtonLink href={ROUTES.membership} variant="secondary" className="self-start">
          Back to membership
        </ButtonLink>
      </Container>
    </section>
  );
}

interface AccountLoadErrorProps {
  /** Already mapped by describeMembershipError, so it is safe to show. */
  message: string;
}

/** Shown when the account could not be loaded. The page never shows raw error text. */
export function AccountLoadError({ message }: AccountLoadErrorProps): ReactElement {
  return (
    <section aria-labelledby="account-title" className="pt-32 pb-16">
      <Container className="flex max-w-xl flex-col gap-8">
        <AccountHeader title="Your membership" />
        <FormMessage tone="error" message={message} />
        <ButtonLink href={ROUTES.membershipAccount} variant="secondary" className="self-start">
          Try again
        </ButtonLink>
      </Container>
    </section>
  );
}
