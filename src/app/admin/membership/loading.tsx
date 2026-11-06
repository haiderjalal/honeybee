import type { JSX } from "react";

import { Container } from "@/components/layout/Container";

/** Placeholder panels shown while the admin page loads its data. */
export default function AdminMembershipLoading(): JSX.Element {
  return (
    <Container className="flex max-w-6xl flex-col gap-8 pt-32 pb-20">
      <p role="status" className="sr-only">
        Loading membership admin
      </p>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="h-10 w-72 rounded-2xl bg-forest-800/60 motion-safe:animate-pulse" />
        <div className="h-72 rounded-3xl border border-cream-50/10 bg-forest-900/60 motion-safe:animate-pulse" />
        <div className="h-96 rounded-3xl border border-cream-50/10 bg-forest-900/60 motion-safe:animate-pulse" />
        <div className="h-80 rounded-3xl border border-cream-50/10 bg-forest-900/60 motion-safe:animate-pulse" />
      </div>
    </Container>
  );
}
