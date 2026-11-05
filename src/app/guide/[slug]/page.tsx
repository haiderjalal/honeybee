import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/shared/JsonLd";
import { ROUTES } from "@/constants/routes";
import { ARTICLES, getArticle } from "@/features/guide/articles";
import { GuideArticle } from "@/features/guide/GuideArticle";
import { GUIDE_TITLE } from "@/features/guide/originalHoneyGuide";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Only the articles in ARTICLES exist; anything else is a hard 404.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return { title: "Guide not found", robots: { index: false } };

  const path = ROUTES.guideArticle(article.slug);
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title: article.title, description: article.description },
    twitter: { card: "summary_large_image", title: article.title, description: article.description },
  };
}

export default async function GuideArticlePage({ params }: PageProps) {
  const article = getArticle((await params).slug);
  if (!article) notFound();

  const path = ROUTES.guideArticle(article.slug);
  const related = [
    { href: ROUTES.guide, label: GUIDE_TITLE },
    ...ARTICLES.filter((other) => other.slug !== article.slug).map((other) => ({
      href: ROUTES.guideArticle(other.slug),
      label: other.title,
    })),
  ];

  return (
    <>
      <GuideArticle
        title={article.title}
        intro={article.intro}
        sections={article.sections}
        faq={article.faq}
        related={related}
      />
      <JsonLd
        data={[
          articleJsonLd({
            title: article.title,
            description: article.description,
            path,
            modified: article.updated,
          }),
          faqJsonLd(article.faq),
          breadcrumbJsonLd([
            { name: "Home", path: ROUTES.home },
            { name: GUIDE_TITLE, path: ROUTES.guide },
            { name: article.title, path },
          ]),
        ]}
      />
    </>
  );
}
