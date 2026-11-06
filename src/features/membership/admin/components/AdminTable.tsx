import type { JSX, ReactNode } from "react";

export const adminHeadCellClass = "px-4 py-3 text-xs font-semibold tracking-wide text-cream-300 uppercase";
export const adminCellClass = "px-4 py-3 align-top text-cream-100";
export const adminRowClass = "border-t border-cream-50/10";

interface AdminTableProps {
  caption: string;
  children: ReactNode;
}

/**
 * A data table that scrolls inside its own frame, so a wide table never widens the page on a phone. The frame is
 * focusable so keyboard users can scroll it.
 */
export function AdminTable({ caption, children }: AdminTableProps): JSX.Element {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-2xl border border-cream-50/10"
    >
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}
