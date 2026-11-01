import { Plus } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FAQ_ITEMS } from "@/constants/content";
import { SECTION_IDS } from "@/constants/routes";

import type { CSSProperties } from "react";

/** Native <details> accordion: accessible, works without JavaScript and is fully indexable. */
export function Faq() {
  return (
    <section
      id={SECTION_IDS.faq}
      aria-labelledby="faq-title"
      className="defer-render py-24"
      style={{ "--defer-height": "900px" } as CSSProperties}
    >
      <Container className="max-w-4xl">
        <SectionHeading id="faq-title" eyebrow="Questions" title="Good to know" />
        <div className="mt-12 divide-y divide-cream-50/10 rounded-3xl border border-cream-50/10 bg-forest-900/50">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} name="faq" className="group px-6 sm:px-8">
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
      </Container>
    </section>
  );
}
