import { HONEY_VARIETIES } from "@/constants/catalog";
import { ARTICLES, getArticle } from "@/features/guide/articles";
import { OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const alt = "HonyB honey guide";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams(): { slug: string }[] {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function GuideArticleOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug) ?? ARTICLES[0];
  return renderOgImage({
    eyebrow: "Honey guide",
    title: article.title,
    subtitle: article.shareLine,
    palette: HONEY_VARIETIES[0].palette,
  });
}
