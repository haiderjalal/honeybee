import { MEMBERSHIP_COPY } from "@/constants/membershipContent";

import type { ReactElement, ReactNode } from "react";

interface AccountHeaderProps {
  title: string;
  children?: ReactNode;
}

/** The page title block. The h1 id is the page's accessible name. */
export function AccountHeader({ title, children }: AccountHeaderProps): ReactElement {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">{MEMBERSHIP_COPY.eyebrow}</p>
      <h1 id="account-title" className="font-display text-4xl leading-none text-cream-50 sm:text-5xl">
        {title}
      </h1>
      {children}
    </header>
  );
}
