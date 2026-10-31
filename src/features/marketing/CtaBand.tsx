import { Bee } from "@/components/art/Bee";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SECTION_IDS } from "@/constants/routes";

import type { CSSProperties } from "react";

export function CtaBand() {
  return (
    <section
      aria-labelledby="cta-title"
      className="defer-render py-16"
      style={{ "--defer-height": "500px" } as CSSProperties}
    >
      <Container>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-gold-400/30 bg-linear-to-br from-gold-500/25 via-forest-800 to-forest-900 px-6 py-16 text-center sm:px-16">
          <div
            aria-hidden="true"
            className="glow-pulse absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gold-400/30 blur-3xl"
          />
          <div aria-hidden="true" className="float-bob absolute top-8 right-10 hidden w-16 sm:block">
            <Bee className="w-full" />
          </div>
          <h2 id="cta-title" className="relative font-display text-4xl text-balance text-cream-50 sm:text-6xl">
            Your jar of <span className="text-gold italic">liquid gold</span> is a few taps away.
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-cream-300">
            Harvest a comb, fill your hive and send your request — we&apos;ll call you to confirm.
          </p>
          <div className="relative mt-9 flex justify-center">
            <ButtonLink href={`/#${SECTION_IDS.lab}`} size="lg">
              Start in the Honey Lab
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
