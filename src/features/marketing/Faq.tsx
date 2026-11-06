import { Container } from "@/components/layout/Container";
import { FaqAccordion } from "@/components/shared/FaqAccordion";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FAQ_ITEMS } from "@/constants/content";
import { SECTION_IDS } from "@/constants/routes";

import type { CSSProperties } from "react";

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
        <div className="mt-12">
          <FaqAccordion items={FAQ_ITEMS} groupName="faq" />
        </div>
      </Container>
    </section>
  );
}
