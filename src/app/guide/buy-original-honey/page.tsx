import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/JsonLd";
import { ROUTES } from "@/constants/routes";
import { GUIDE_DESCRIPTION, GUIDE_FAQ, GUIDE_TITLE, GUIDE_UPDATED } from "@/features/guide/originalHoneyGuide";
import { GuideArticle } from "@/features/guide/GuideArticle";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = {
  title: GUIDE_TITLE,
  description: GUIDE_DESCRIPTION,
  alternates: { canonical: ROUTES.guide },
  openGraph: { type: "article", url: ROUTES.guide, title: GUIDE_TITLE, description: GUIDE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: GUIDE_TITLE, description: GUIDE_DESCRIPTION },
};

export default function BuyOriginalHoneyPage() {
  return (
    <>
      <GuideArticle />
      <JsonLd
        data={[
          articleJsonLd({
            title: GUIDE_TITLE,
            description: GUIDE_DESCRIPTION,
            path: ROUTES.guide,
            modified: GUIDE_UPDATED,
          }),
          faqJsonLd(GUIDE_FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: ROUTES.home },
            { name: GUIDE_TITLE, path: ROUTES.guide },
          ]),
        ]}
      />
    </>
  );
}
