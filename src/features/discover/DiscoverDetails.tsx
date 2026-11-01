import { Check } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/shared/Reveal";
import { ROUTES } from "@/constants/routes";
import { getJarSizes } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";

import type { HoneyVariety } from "@/types/catalog";

interface DiscoverDetailsProps {
  variety: HoneyVariety;
}

/** Facts, tasting notes, ways to enjoy the honey, and the jar sizes with their prices. */
export function DiscoverDetails({ variety }: DiscoverDetailsProps) {
  const facts: [string, string][] = [
    ["Floral source", variety.source],
    ["Harvest", variety.season],
    ["Colour", variety.colour],
    ["Texture", variety.texture],
  ];
  const sizes = getJarSizes();
  const shortName = variety.name.replace(" Honey", "");

  return (
    <section aria-labelledby="discover-details" className="py-16 sm:py-24">
      <Container className="grid gap-8 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[2rem] border border-cream-50/10 bg-forest-900/60 p-8 sm:p-10">
            <h2 id="discover-details" className="font-display text-4xl text-cream-50">
              What to expect
            </h2>
            <dl className="mt-6 divide-y divide-cream-50/10">
              {facts.map(([term, detail]) => (
                <div key={term} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-sm text-cream-500">{term}</dt>
                  <dd className="text-cream-100">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="h-full rounded-[2rem] border border-gold-400/20 bg-linear-to-br from-forest-800/80 to-forest-900/90 p-8 sm:p-10">
            <h2 className="font-display text-4xl text-cream-50">Tasting notes</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {variety.tastingNotes.map((note) => (
                <li
                  key={note}
                  className="rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm text-gold-200"
                >
                  {note}
                </li>
              ))}
            </ul>

            <h3 className="mt-10 font-display text-2xl text-cream-50">How to enjoy it</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {variety.bestFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-cream-300">
                  <Check className="mt-0.5 size-5 shrink-0 text-sage-300" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-2">
          <div className="rounded-[2rem] border border-cream-50/10 bg-forest-900/60 p-8 sm:p-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-4xl text-cream-50">Jar sizes and prices</h2>
              <Link
                href={ROUTES.variety(variety.slug)}
                className="text-sm font-medium text-gold-300 underline-offset-4 hover:underline"
              >
                Order {shortName} honey →
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {sizes.map((size) => (
                <li key={size.id} className="rounded-2xl border border-gold-400/20 bg-forest-900 p-6 text-center">
                  <p className="text-sm text-cream-500">{size.label}</p>
                  <p className="mt-2 font-display text-4xl text-gold-300 tabular-nums">
                    {formatPkr(variety.prices[size.id])}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
