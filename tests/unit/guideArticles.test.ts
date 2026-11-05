import { describe, expect, it } from "vitest";

import { ROUTES } from "@/constants/routes";
import { ARTICLES, getArticle } from "@/features/guide/articles";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/lib/seo/llmsText";

describe("guide articles", () => {
  it("has three articles with unique slugs", () => {
    const slugs = ARTICLES.map((article) => article.slug);

    expect(ARTICLES).toHaveLength(3);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps titles short enough and descriptions within the search-result range", () => {
    for (const article of ARTICLES) {
      // The layout adds " | HonyB" to the title, keeping the whole tag within 65 characters.
      expect(article.title.length).toBeLessThanOrEqual(57);
      expect(article.description.length).toBeGreaterThanOrEqual(120);
      expect(article.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("gives every article sections and questions", () => {
    for (const article of ARTICLES) {
      expect(article.sections.length).toBeGreaterThanOrEqual(3);
      expect(article.faq.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("finds an article by slug and returns null for an unknown one", () => {
    expect(getArticle("why-honey-crystallises")?.title).toBe("Why honey crystallises, and what to do about it");
    expect(getArticle("manuka")).toBeNull();
  });

  it("mentions no place outside Pakistan", () => {
    const text = JSON.stringify(ARTICLES);

    expect(text).not.toContain("Kabul");
  });

  it("lists every article in llms.txt and includes its text in llms-full.txt", () => {
    const summary = buildLlmsTxt();
    const full = buildLlmsFullTxt();

    for (const article of ARTICLES) {
      expect(summary).toContain(ROUTES.guideArticle(article.slug));
      expect(full).toContain(article.title);
    }
  });
});
