import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/JsonLd";
import { PauseOffscreen } from "@/components/shared/PauseOffscreen";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { VarietyShowcase } from "@/features/catalog/VarietyShowcase";
import { Hero } from "@/features/hero/Hero";
import { Marquee } from "@/features/marketing/Marquee";
import { HoneyLabSection } from "@/features/honey-lab/HoneyLabSection";
import { SwarmIntro } from "@/features/intro/SwarmIntro";
import { CtaBand } from "@/features/marketing/CtaBand";
import { Faq } from "@/features/marketing/Faq";
import { HoneycombWall } from "@/features/honeycomb/HoneycombWall";
import { loadHoneycombEntries } from "@/features/honeycomb/loadHoneycomb";
import { Process } from "@/features/marketing/Process";
import { Promises } from "@/features/marketing/Promises";
import { PourStory } from "@/features/pour-story/PourStory";
import { faqJsonLd, itemListJsonLd } from "@/lib/seo/jsonLd";
import { getJarSizes, getVarieties } from "@/services/catalog.service";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The honeycomb of customers changes as orders come in, so the page refreshes every five minutes.
export const revalidate = 300;

export default async function HomePage() {
  const varieties = getVarieties();
  const honeycomb = await loadHoneycombEntries();

  return (
    <>
      <SwarmIntro />
      <Hero />
      <Marquee />
      <SectionDivider />
      <PourStory varieties={varieties} sizes={getJarSizes()} />
      <SectionDivider />
      <HoneyLabSection />
      <SectionDivider />
      <VarietyShowcase />
      <SectionDivider />
      <Promises />
      <Process />
      <SectionDivider />
      <HoneycombWall entries={honeycomb} />
      <SectionDivider />
      <Faq />
      <SectionDivider />
      <CtaBand />
      <PauseOffscreen />
      <JsonLd data={[itemListJsonLd(varieties), faqJsonLd()]} />
    </>
  );
}
