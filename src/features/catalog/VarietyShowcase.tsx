import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HoneyJar } from "@/components/art/HoneyJar";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ROUTES, SECTION_IDS } from "@/constants/routes";
import { getDiscoverSlug, getJarSizes, getVarieties } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";
import { honeyStyle } from "@/utils/honeyStyle";

import type { CSSProperties } from "react";

export function VarietyShowcase() {
  const sizes = getJarSizes();

  return (
    <section
      id={SECTION_IDS.varieties}
      aria-labelledby="varieties-title"
      className="defer-render py-28 sm:py-36"
      style={{ "--defer-height": "1500px" } as CSSProperties}
    >
      <Container>
        <SectionHeading
          id="varieties-title"
          eyebrow="Our honey"
          title={
            <>
              Three hives, <span className="text-gold italic">three characters.</span>
            </>
          }
          description="Every variety comes in 500 g, 1 kg and 2 kg jars. Prices in Pakistani rupees."
        />

        <ul className="mt-16 grid gap-6 md:grid-cols-3">
          {getVarieties().map((variety, index) => (
            <li key={variety.slug}>
              <Reveal delay={index * 0.12} className="h-full">
                <article
                  className="sheen group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-cream-50/10 bg-linear-to-b from-forest-800/80 to-forest-900/90 p-8 transition-[border-color,translate] duration-500 hover:-translate-y-2 hover:border-gold-400/40"
                  style={honeyStyle(variety.palette)}
                >
                  <div
                    aria-hidden="true"
                    className="absolute -top-24 -right-24 size-64 rounded-full opacity-30 blur-3xl transition-opacity duration-700 group-hover:opacity-60"
                    style={{ background: variety.palette.base }}
                  />
                  <div className="relative mx-auto h-56 w-40 transition-transform duration-700 ease-(--ease-honey) group-hover:scale-105 group-hover:-rotate-3">
                    <HoneyJar
                      className="size-full"
                      fill={0.9}
                      label={{ title: variety.localName, subtitle: variety.colour }}
                    />
                  </div>
                  <h3 className="relative mt-8 font-display text-3xl text-cream-50">
                    <Link
                      href={ROUTES.discover(getDiscoverSlug(variety))}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {variety.name}
                    </Link>
                  </h3>
                  <p className="relative mt-1 text-gold-300">{variety.tagline}</p>
                  <p className="relative mt-4 flex-1 text-cream-300">{variety.description}</p>

                  <dl className="relative mt-6 grid grid-cols-3 gap-2 border-t border-cream-50/10 pt-5 text-center">
                    {sizes.map((size) => (
                      <div key={size.id}>
                        <dt className="text-xs text-cream-500">{size.label}</dt>
                        <dd className="text-sm font-medium text-cream-50 tabular-nums">
                          {formatPkr(variety.prices[size.id])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="relative mt-6 flex items-center gap-2 text-sm font-medium text-gold-300">
                    Discover {variety.name.replace(" Honey", "")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
