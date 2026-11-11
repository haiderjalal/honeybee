import { describe, expect, it } from "vitest";

import { getVarietyBySlug } from "@/services/catalog.service";
import { articleJsonLd, productJsonLd } from "@/lib/seo/jsonLd";

type JsonObject = Record<string, unknown>;

describe("productJsonLd", () => {
  it("gives Google the name, an absolute image and a PKR price range", () => {
    const sidr = getVarietyBySlug("sidr-honey");
    if (!sidr) throw new Error("Sidr honey is missing from the catalogue");

    const product = productJsonLd(sidr) as JsonObject;
    const offers = product.offers as JsonObject;

    expect(product["@type"]).toBe("Product");
    expect(product.name).toBe("Sidr Honey");
    expect(String(product.image)).toMatch(/^https?:\/\//);
    expect(offers.priceCurrency).toBe("PKR");
    expect(offers.lowPrice).toBe(1950);
    expect(offers.highPrice).toBe(7800);
    expect(offers.offerCount).toBe(3);
  });
});

describe("articleJsonLd", () => {
  it("includes the fields Google needs for an article: image, dates, author and publisher logo", () => {
    const article = articleJsonLd({
      title: "How to buy original honey in Pakistan",
      description: "A short guide.",
      path: "/guide/buy-original-honey",
      modified: "2026-11-05",
    }) as JsonObject;
    const author = article.author as JsonObject;
    const publisher = article.publisher as JsonObject;

    expect(article["@type"]).toBe("Article");
    expect(article.headline).toBe("How to buy original honey in Pakistan");
    expect(String(article.image)).toMatch(/^https?:\/\/.+\/guide\/buy-original-honey\/opengraph-image$/);
    expect(article.datePublished).toBe("2026-11-05");
    expect(author.name).toBe("HonyB");
    expect((publisher.logo as JsonObject).url).toMatch(/\/icon\.png$/);
  });
});
