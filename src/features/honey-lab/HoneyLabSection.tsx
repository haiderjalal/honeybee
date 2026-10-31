import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SECTION_IDS } from "@/constants/routes";
import { getJarSizes, getVarieties } from "@/services/catalog.service";

import { HoneyLab } from "./HoneyLab";

export function HoneyLabSection() {
  return (
    <section id={SECTION_IDS.lab} aria-labelledby="lab-title" data-pause-offscreen className="relative py-28 sm:py-36">
      <Container className="max-w-5xl">
        <SectionHeading
          id="lab-title"
          eyebrow="The Honey Lab"
          title={
            <>
              Harvest a comb. <span className="text-gold italic">Fill your hive.</span>
            </>
          }
          description="Choose a honeycomb and our bee will fill the jars. Then drag the jar you want into your hive in the corner — or tap Add to hive."
        />
        <div className="mt-16">
          <HoneyLab varieties={getVarieties()} sizes={getJarSizes()} />
        </div>
      </Container>
    </section>
  );
}
