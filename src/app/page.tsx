import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/JsonLd";
import { PauseOffscreen } from "@/components/shared/PauseOffscreen";
import { VarietyShowcase } from "@/features/catalog/VarietyShowcase";
import { Hero } from "@/features/hero/Hero";
import { Marquee } from "@/features/marketing/Marquee";
import { HoneyLabSection } from "@/features/honey-lab/HoneyLabSection";
import { SwarmIntro } from "@/features/intro/SwarmIntro";
import { CtaBand } from "@/features/marketing/CtaBand";
import { Faq } from "@/features/marketing/Faq";
import { Process } from "@/features/marketing/Process";
import { Promises } from "@/features/marketing/Promises";
import { PourStory } from "@/features/pour-story/PourStory";
import { faqJsonLd, itemListJsonLd } from "@/lib/seo/jsonLd";
import { getJarSizes, getVarieties } from "@/services/catalog.service";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const varieties = getVarieties();

  return (
    <>
      <SwarmIntro />
      <Hero />
      <Marquee />
      <PourStory varieties={varieties} sizes={getJarSizes()} />
      <HoneyLabSection />
      <VarietyShowcase />
      <Promises />
      <Process />
      <Faq />
      <CtaBand />
      <PauseOffscreen />
      <JsonLd data={[itemListJsonLd(varieties), faqJsonLd()]} />
    </>
  );
}
