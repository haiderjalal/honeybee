import type { MetadataRoute } from "next";

import { ROUTES } from "@/constants/routes";
import { absoluteUrl } from "@/constants/site";
import { getDiscoverSlug, getVarieties } from "@/services/catalog.service";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl(ROUTES.home), changeFrequency: "weekly", priority: 1 },
    ...getVarieties().flatMap((variety) => [
      {
        url: absoluteUrl(ROUTES.discover(getDiscoverSlug(variety))),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
      {
        url: absoluteUrl(ROUTES.variety(variety.slug)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
    ]),
  ];
}
