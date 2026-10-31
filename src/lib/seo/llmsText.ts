import { FAQ_ITEMS, ORDER_STEPS, PROMISES } from "@/constants/content";
import { ROUTES } from "@/constants/routes";
import { SITE, absoluteUrl } from "@/constants/site";
import { getJarSizes, getStartingPrice, getVarieties } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";

/**
 * llms.txt (https://llmstxt.org) — a concise, factual brief for AI assistants.
 * Generated from the catalogue so prices and products are always current.
 */
export function buildLlmsTxt(): string {
  const varieties = getVarieties()
    .map(
      (variety) =>
        `- [${variety.name} (${variety.localName})](${absoluteUrl(ROUTES.variety(variety.slug))}): ${variety.tagline} From ${formatPkr(getStartingPrice(variety))}.`,
    )
    .join("\n");

  return `# ${SITE.name}

> ${SITE.description}

${SITE.name} sells raw honey in Pakistan. Customers build an order online and send an order request; the team confirms delivery and payment by phone or WhatsApp. No payment is taken on the website.

## Honey varieties

${varieties}

## Ordering

- [Send an order request](${absoluteUrl(ROUTES.checkout)}): name, mobile number, city and delivery address.
- Jar sizes: ${getJarSizes()
    .map((size) => size.label)
    .join(", ")}.
- Currency: Pakistani rupees (PKR).

## Optional

- [Full product and FAQ details](${absoluteUrl("/llms-full.txt")})
`;
}

export function buildLlmsFullTxt(): string {
  const sizes = getJarSizes();
  const varieties = getVarieties()
    .map((variety) => {
      const prices = sizes.map((size) => `  - ${size.label}: ${formatPkr(variety.prices[size.id])}`).join("\n");
      return `### ${variety.name} (${variety.localName})

URL: ${absoluteUrl(ROUTES.variety(variety.slug))}

${variety.description}

- Floral source: ${variety.source}
- Harvest: ${variety.season}
- Colour: ${variety.colour}
- Texture: ${variety.texture}
- Tasting notes: ${variety.tastingNotes.join(", ")}
- Best for: ${variety.bestFor.join(", ")}
- Prices:
${prices}`;
    })
    .join("\n\n");

  return `# ${SITE.name} — full details

> ${SITE.description}

## Products

${varieties}

## How ordering works

${ORDER_STEPS.map((step, index) => `${index + 1}. ${step.title} — ${step.body}`).join("\n")}

## Our promise

${PROMISES.map((promise) => `- ${promise.title}: ${promise.body}`).join("\n")}

## Frequently asked questions

${FAQ_ITEMS.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}
`;
}
