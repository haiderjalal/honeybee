import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Bee } from "@/components/art/Bee";
import { Honeycomb } from "@/components/art/Honeycomb";
import { HoneyJar } from "@/components/art/HoneyJar";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { ROUTES } from "@/constants/routes";
import { AddToHivePanel } from "@/features/catalog/AddToHivePanel";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonLd";
import { getJarSizes, getStartingPrice, getVarieties, getVarietyBySlug } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";
import { honeyStyle } from "@/utils/honeyStyle";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Only catalogue slugs exist; anything else is a hard 404 (not a soft 404 with status 200).
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getVarieties().map((variety) => ({ slug: variety.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const variety = getVarietyBySlug((await params).slug);
  if (!variety) return { title: "Honey not found", robots: { index: false } };

  const title = `${variety.name} (${variety.localName}) — 500 g, 1 kg & 2 kg from ${formatPkr(getStartingPrice(variety))}`;
  const description = `${variety.tagline} ${variety.description.split(". ")[0]}. Order raw ${variety.name.toLowerCase()} online with delivery across Pakistan.`;
  const path = ROUTES.variety(variety.slug);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function VarietyPage({ params }: PageProps) {
  const variety = getVarietyBySlug((await params).slug);
  if (!variety) notFound();

  const sizes = getJarSizes();
  const others = getVarieties().filter((v) => v.slug !== variety.slug);
  const facts: [string, string][] = [
    ["Floral source", variety.source],
    ["Harvest", variety.season],
    ["Colour", variety.colour],
    ["Texture", variety.texture],
    ["Tasting notes", variety.tastingNotes.join(", ")],
    ["Best for", variety.bestFor.join(", ")],
  ];

  return (
    <article style={honeyStyle(variety.palette)}>
      <Container className="pt-28 pb-16 sm:pt-32">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-cream-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={ROUTES.home} className="hover:text-gold-300">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/#varieties" className="hover:text-gold-300">
                Our honey
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-cream-300">
              {variety.name}
            </li>
          </ol>
        </nav>

        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative mx-auto aspect-square w-full max-w-lg">
            <div
              aria-hidden="true"
              className="glow-pulse absolute inset-[10%] rounded-full blur-3xl"
              style={{ background: `${variety.palette.base}66` }}
            />
            <Honeycomb className="absolute top-0 left-0 w-2/5 -rotate-12" dripping />
            <div className="float-bob absolute inset-x-[20%] top-[10%] bottom-[2%]">
              <HoneyJar
                className="size-full"
                fill={0.88}
                label={{ title: variety.localName, subtitle: variety.colour }}
              />
            </div>
            <div
              aria-hidden="true"
              className="float-bob absolute top-[8%] right-[6%] w-16"
              style={{ animationDelay: "-2s" }}
            >
              <Bee className="w-full" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">{variety.localName} honey</p>
            <h1 className="font-display text-5xl leading-none font-medium text-cream-50 sm:text-7xl">{variety.name}</h1>
            <p className="text-xl text-gold-300">{variety.tagline}</p>
            <p className="text-lg text-cream-300">{variety.description}</p>
            <AddToHivePanel variety={variety} sizes={sizes} />
          </div>
        </div>

        <SectionDivider />
        <section aria-labelledby="facts-title" className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <h2 id="facts-title" className="font-display text-4xl text-cream-50">
            About {variety.name.toLowerCase()}
          </h2>
          <dl className="divide-y divide-cream-50/10 rounded-3xl border border-cream-50/10 bg-forest-900/60 px-6 sm:px-8">
            {facts.map(([term, detail]) => (
              <div key={term} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm text-cream-500">{term}</dt>
                <dd className="text-cream-100">{detail}</dd>
              </div>
            ))}
            <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
              <dt className="text-sm text-cream-500">Prices</dt>
              <dd className="text-cream-100">
                {sizes.map((size) => `${size.label} ${formatPkr(variety.prices[size.id])}`).join(" · ")}
              </dd>
            </div>
          </dl>
        </section>

        <SectionDivider />
        <section aria-labelledby="others-title" className="mt-24">
          <h2 id="others-title" className="font-display text-3xl text-cream-50">
            Explore other honey
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={ROUTES.variety(other.slug)}
                  className="flex items-center gap-5 rounded-3xl border border-cream-50/10 bg-forest-900/60 p-5 transition-colors hover:border-gold-400/40"
                  style={honeyStyle(other.palette)}
                >
                  <span className="h-20 w-14 shrink-0">
                    <HoneyJar fill={0.88} className="size-full" />
                  </span>
                  <span>
                    <span className="block font-display text-2xl text-cream-50">{other.name}</span>
                    <span className="text-cream-300">
                      {other.tagline} From {formatPkr(getStartingPrice(other))}.
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      <JsonLd
        data={[
          productJsonLd(variety),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Our honey", path: "/#varieties" },
            { name: variety.name, path: ROUTES.variety(variety.slug) },
          ]),
        ]}
      />
    </article>
  );
}
