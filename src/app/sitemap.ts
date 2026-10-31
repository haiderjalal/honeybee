import type { MetadataRoute } from "next";

import { ROUTES } from "@/constants/routes";
import { absoluteUrl } from "@/constants/site";
import { getVarieties } from "@/services/catalog.service";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl(ROUTES.home), changeFrequency: "weekly", priority: 1 },
    ...getVarieties().map((variety) => ({
      url: absoluteUrl(ROUTES.variety(variety.slug)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
