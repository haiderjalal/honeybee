import { OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";
import { getStartingPrice, getVarieties, getVarietyBySlug } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";

export const alt = "HonyB honey variety";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams(): { slug: string }[] {
  return getVarieties().map((variety) => ({ slug: variety.slug }));
}

export default async function VarietyOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const variety = getVarietyBySlug((await params).slug) ?? getVarieties()[0];
  return renderOgImage({
    eyebrow: `${variety.localName} honey`,
    title: variety.name,
    subtitle: `${variety.tagline} From ${formatPkr(getStartingPrice(variety))}.`,
    palette: variety.palette,
  });
}
