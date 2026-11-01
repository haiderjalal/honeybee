import { HONEY_VARIETIES, JAR_SIZES } from "@/constants/catalog";

import type { HoneyVariety, JarSize, PricedVariant, SizeId } from "@/types/catalog";

export function getVarieties(): readonly HoneyVariety[] {
  return HONEY_VARIETIES;
}

export function getVarietyBySlug(slug: string): HoneyVariety | null {
  return HONEY_VARIETIES.find((variety) => variety.slug === slug) ?? null;
}

/** Short URL segment for a variety's discover page, e.g. "sidr-honey" becomes "sidr". */
export function getDiscoverSlug(variety: HoneyVariety): string {
  return variety.slug.replace(/-honey$/, "");
}

export function getVarietyByDiscoverSlug(discoverSlug: string): HoneyVariety | null {
  return HONEY_VARIETIES.find((variety) => getDiscoverSlug(variety) === discoverSlug) ?? null;
}

export function getJarSizes(): readonly JarSize[] {
  return JAR_SIZES;
}

export function getJarSize(sizeId: string): JarSize | null {
  return JAR_SIZES.find((size) => size.id === sizeId) ?? null;
}

/** Resolves a variant and its authoritative price. Returns null for unknown variants. */
export function getPricedVariant(varietySlug: string, sizeId: string): PricedVariant | null {
  const variety = getVarietyBySlug(varietySlug);
  const size = getJarSize(sizeId);
  if (!variety || !size) return null;

  return { variety, size, unitPrice: variety.prices[size.id as SizeId] };
}

export function getStartingPrice(variety: HoneyVariety): number {
  return Math.min(...Object.values(variety.prices));
}
