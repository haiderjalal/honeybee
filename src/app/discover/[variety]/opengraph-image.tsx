import { OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";
import { getDiscoverSlug, getVarieties, getVarietyByDiscoverSlug } from "@/services/catalog.service";

export const alt = "Discover HonyB honey";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams(): { variety: string }[] {
  return getVarieties().map((variety) => ({ variety: getDiscoverSlug(variety) }));
}

export default async function DiscoverOgImage({ params }: { params: Promise<{ variety: string }> }) {
  const variety = getVarietyByDiscoverSlug((await params).variety) ?? getVarieties()[0];
  return renderOgImage({
    eyebrow: `Discover · ${variety.localName} honey`,
    title: variety.name,
    subtitle: variety.tagline,
    palette: variety.palette,
  });
}
