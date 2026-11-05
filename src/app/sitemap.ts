import type { MetadataRoute } from "next";

import { ROUTES } from "@/constants/routes";
import { absoluteUrl } from "@/constants/site";
import { ARTICLES } from "@/features/guide/articles";
import { getDiscoverSlug, getVarieties } from "@/services/catalog.service";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl(ROUTES.home), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl(ROUTES.guide), changeFrequency: "monthly", priority: 0.9 },
    ...ARTICLES.map((article) => ({
      url: absoluteUrl(ROUTES.guideArticle(article.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
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
