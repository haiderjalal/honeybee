import { FAQ_ITEMS } from "@/constants/content";
import { ROUTES } from "@/constants/routes";
import { SITE, absoluteUrl } from "@/constants/site";
import { getJarSizes, getStartingPrice } from "@/services/catalog.service";

import type { FaqItem } from "@/constants/content";
import type { HoneyVariety } from "@/types/catalog";

const ORGANIZATION_ID = `${SITE.url}/#organization`;

export function organizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/icon.png"),
    description: SITE.description,
    areaServed: { "@type": "Country", name: SITE.country },
  };
}

export function websiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "en-PK",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function productJsonLd(variety: HoneyVariety): object {
  const url = absoluteUrl(ROUTES.variety(variety.slug));
  const offers = getJarSizes().map((size) => ({
    "@type": "Offer",
    name: `${variety.name} ${size.label}`,
    sku: `${variety.slug}-${size.id}`,
    price: variety.prices[size.id],
    priceCurrency: SITE.currency,
    availability: "https://schema.org/InStock",
    url,
    seller: { "@id": ORGANIZATION_ID },
  }));
  const prices = offers.map((offer) => offer.price);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: variety.name,
    alternateName: `${variety.localName} honey`,
    description: variety.description,
    url,
    image: absoluteUrl(`${ROUTES.variety(variety.slug)}/opengraph-image`),
    brand: { "@type": "Brand", name: SITE.name },
    category: "Honey",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Floral source", value: variety.source },
      { "@type": "PropertyValue", name: "Harvest", value: variety.season },
      { "@type": "PropertyValue", name: "Colour", value: variety.colour },
      { "@type": "PropertyValue", name: "Tasting notes", value: variety.tastingNotes.join(", ") },
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: SITE.currency,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: offers.length,
      offers,
    },
  };
}

export function itemListJsonLd(varieties: readonly HoneyVariety[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE.name} honey varieties`,
    itemListElement: varieties.map((variety, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(ROUTES.variety(variety.slug)),
      name: `${variety.name} — from Rs ${getStartingPrice(variety)}`,
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqJsonLd(items: readonly FaqItem[] = FAQ_ITEMS): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
