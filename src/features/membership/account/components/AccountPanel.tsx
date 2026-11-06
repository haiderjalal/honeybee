import { cn } from "@/utils/cn";

import type { ReactElement, ReactNode } from "react";

interface AccountPanelProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

/** A titled card used for every section of the account page, so the sections share one look. */
export function AccountPanel({ id, title, children, className }: AccountPanelProps): ReactElement {
  return (
    <section
      aria-labelledby={id}
      className={cn("rounded-3xl border border-cream-50/10 bg-forest-900/60 p-6 sm:p-8", className)}
    >
      <h2 id={id} className="font-display text-3xl leading-tight text-cream-50">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}
