import type { ReactElement } from "react";

interface DetailItemProps {
  label: string;
  value: string;
}

/** One labelled value inside a description list. */
export function DetailItem({ label, value }: DetailItemProps): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-cream-500">{label}</dt>
      <dd className="text-cream-100 tabular-nums">{value}</dd>
    </div>
  );
}
