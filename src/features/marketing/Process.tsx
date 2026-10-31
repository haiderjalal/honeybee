import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ORDER_STEPS } from "@/constants/content";
import { SECTION_IDS } from "@/constants/routes";
import { hexPointsAttr } from "@/utils/hex";

import type { CSSProperties } from "react";

export function Process() {
  return (
    <section
      id={SECTION_IDS.process}
      aria-labelledby="process-title"
      className="defer-render py-24 sm:py-32"
      style={{ "--defer-height": "800px" } as CSSProperties}
    >
      <Container>
        <SectionHeading
          id="process-title"
          eyebrow="How it works"
          title={
            <>
              From hive to home <span className="text-gold italic">in five steps.</span>
            </>
          }
          description="No online payment, no accounts. Just send a request and a real person confirms everything with you."
        />

        <div className="relative mt-16">
          <div
            aria-hidden="true"
            className="draw-x absolute top-8 right-[10%] left-[10%] hidden h-px bg-linear-to-r from-transparent via-gold-400/50 to-transparent md:block"
          />
          <ol className="relative grid gap-8 md:grid-cols-5 md:gap-4">
            {ORDER_STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <Reveal delay={index * 0.1} className="flex flex-col items-center text-center">
                  <span className="relative grid size-16 place-items-center">
                    <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" aria-hidden="true">
                      <polygon
                        points={hexPointsAttr(32, 32, 30)}
                        fill="#0b1f17"
                        stroke="#f6bd3c"
                        strokeOpacity="0.7"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span className="relative font-display text-2xl text-gold-300">{index + 1}</span>
                  </span>
                  <h3 className="mt-5 font-display text-xl text-cream-50">{step.title}</h3>
                  <p className="mt-2 max-w-60 text-sm text-cream-300">{step.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
