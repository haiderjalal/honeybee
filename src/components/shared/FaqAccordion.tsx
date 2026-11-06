import { Plus } from "lucide-react";

import type { FaqItem } from "@/constants/content";

interface FaqAccordionProps {
  items: readonly FaqItem[];
  /** Groups the details so only one answer is open at a time. Use a distinct name per list on a page. */
  groupName?: string;
}

/** Native <details> accordion: accessible, works without JavaScript and is fully indexable. */
export function FaqAccordion({ items, groupName = "faq" }: FaqAccordionProps) {
  return (
    <div className="divide-y divide-cream-50/10 rounded-3xl border border-cream-50/10 bg-forest-900/50">
      {items.map((item) => (
        <details key={item.question} name={groupName} className="group px-6 sm:px-8">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-xl text-cream-50 marker:hidden [&::-webkit-details-marker]:hidden">
            {item.question}
            <Plus
              className="size-5 shrink-0 text-gold-400 transition-transform duration-300 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <p className="pb-6 text-cream-300">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
