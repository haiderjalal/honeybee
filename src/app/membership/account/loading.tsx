import { Container } from "@/components/layout/Container";

import type { ReactElement } from "react";

const SKELETON_SECTIONS = ["status", "orders", "reminders"] as const;

/** Layout placeholder shown while the account loads, so the page does not jump when the data arrives. */
export default function Loading(): ReactElement {
  return (
    <section aria-busy="true" className="pt-32 pb-16">
      <Container className="flex max-w-4xl flex-col gap-8">
        <p role="status" className="sr-only">
          Loading your membership account
        </p>

        <div aria-hidden="true" className="flex flex-col gap-3">
          <div className="h-4 w-40 rounded-full bg-forest-800/70 motion-safe:animate-pulse" />
          <div className="h-12 w-72 rounded-2xl bg-forest-800/70 motion-safe:animate-pulse" />
        </div>

        {SKELETON_SECTIONS.map((section) => (
          <div
            key={section}
            aria-hidden="true"
            className="h-48 rounded-3xl border border-cream-50/10 bg-forest-900/60 motion-safe:animate-pulse"
          />
        ))}
      </Container>
    </section>
  );
}
