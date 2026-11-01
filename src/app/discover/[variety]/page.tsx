import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { ROUTES } from "@/constants/routes";
import { DiscoverDetails } from "@/features/discover/DiscoverDetails";
import { DiscoverHero } from "@/features/discover/DiscoverHero";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { getDiscoverSlug, getStartingPrice, getVarieties, getVarietyByDiscoverSlug } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";
import { honeyStyle } from "@/utils/honeyStyle";

interface PageProps {
  params: Promise<{ variety: string }>;
}

// Only catalogue varieties have discover pages; anything else is a hard 404.
export const dynamicParams = false;

export function generateStaticParams(): { variety: string }[] {
  return getVarieties().map((variety) => ({ variety: getDiscoverSlug(variety) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const variety = getVarietyByDiscoverSlug((await params).variety);
  if (!variety) return { title: "Honey not found", robots: { index: false } };

  const title = `Discover ${variety.name}: taste, origin and how to enjoy it`;
  const description = `${variety.tagline} Learn where ${variety.name.toLowerCase()} comes from, how it tastes and the best ways to enjoy it. Jars from ${formatPkr(getStartingPrice(variety))}.`;
  const path = ROUTES.discover(getDiscoverSlug(variety));

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DiscoverPage({ params }: PageProps) {
  const variety = getVarietyByDiscoverSlug((await params).variety);
  if (!variety) notFound();

  const path = ROUTES.discover(getDiscoverSlug(variety));
  const others = getVarieties().filter((other) => other.slug !== variety.slug);

  return (
    <article className="pt-28 pb-8" style={honeyStyle(variety.palette)}>
      <Container>
        <nav aria-label="Breadcrumb" className="text-sm text-forest-800">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={ROUTES.home} className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/#varieties" className="hover:underline">
                Discover
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-forest-950">
              {variety.name}
            </li>
          </ol>
        </nav>
      </Container>

      <DiscoverHero variety={variety} />
      <DiscoverDetails variety={variety} />

      <section aria-labelledby="more-discover" className="pb-24">
        <Container>
          <h2 id="more-discover" className="font-display text-4xl text-forest-950">
            Discover more honey
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={ROUTES.discover(getDiscoverSlug(other))}
                  className="group flex items-center gap-5 rounded-[2rem] border border-forest-950/10 bg-cream-50/80 p-6 transition-transform duration-500 hover:-translate-y-1"
                >
                  <span
                    aria-hidden="true"
                    className="size-16 shrink-0 rounded-full ring-4 ring-forest-950/10"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${other.palette.light}, ${other.palette.base} 60%, ${other.palette.deep})`,
                    }}
                  />
                  <span>
                    <span className="block font-display text-3xl text-forest-950">{other.name}</span>
                    <span className="text-forest-900/80">
                      {other.tagline} From {formatPkr(getStartingPrice(other))}.
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Discover", path: "/#varieties" },
          { name: variety.name, path },
        ])}
      />
    </article>
  );
}
