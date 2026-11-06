import type { JSX, ReactNode } from "react";

export interface Fact {
  label: string;
  value: ReactNode;
}

/** Label and value pairs for a record, laid out as a responsive grid. */
export function FactList({ facts }: { facts: Fact[] }): JSX.Element {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0 rounded-2xl border border-cream-50/10 bg-forest-950/40 p-4">
          <dt className="text-xs tracking-wide text-cream-500 uppercase">{fact.label}</dt>
          <dd className="mt-1 break-words text-cream-50 tabular-nums">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
