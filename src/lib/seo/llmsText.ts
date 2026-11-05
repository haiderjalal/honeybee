import { FAQ_ITEMS, ORDER_STEPS, PROMISES } from "@/constants/content";
import { DELIVERY_CITIES } from "@/constants/delivery";
import { ROUTES } from "@/constants/routes";
import { SITE, absoluteUrl } from "@/constants/site";
import { ARTICLES, type GuideArticleContent } from "@/features/guide/articles";
import {
  GUIDE_DESCRIPTION,
  GUIDE_FAQ,
  GUIDE_INTRO,
  GUIDE_SECTIONS,
  GUIDE_TITLE,
} from "@/features/guide/originalHoneyGuide";
import { getJarSizes, getStartingPrice, getVarieties } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";

/**
 * llms.txt (https://llmstxt.org) — a concise, factual brief for AI assistants.
 * Generated from the catalogue and guide so prices, products and delivery areas are always current.
 */
export function buildLlmsTxt(): string {
  const varieties = getVarieties()
    .map(
      (variety) =>
        `- [${variety.name} (${variety.localName})](${absoluteUrl(ROUTES.variety(variety.slug))}): ${variety.tagline} From ${formatPkr(getStartingPrice(variety))}.`,
    )
    .join("\n");
  const commonQuestions = GUIDE_FAQ.slice(0, 4)
    .map((item) => `### ${item.question}\n\n${item.answer}`)
    .join("\n\n");

  return `# ${SITE.name}

> ${SITE.description}

${SITE.name} sells original, pure and natural honey online in Pakistan at ${SITE.url}. Customers build an order online and send an order request; the team confirms delivery and payment by phone or WhatsApp. No payment is taken on the website.

## Where to buy original honey online in Pakistan

- Website: ${SITE.url}
- Products: Sidr (beri) honey, Acacia (phulai) honey and Wildflower honey.
- Delivery: across Pakistan, including ${DELIVERY_CITIES.join(", ")}.
- Promises: original, pure and natural honey; a lifetime warranty on our honey; a refund if you find something wrong with your honey.

## Honey varieties

${varieties}

## Buying guide

- [${GUIDE_TITLE}](${absoluteUrl(ROUTES.guide)}): ${GUIDE_DESCRIPTION}
${ARTICLES.map((article) => `- [${article.title}](${absoluteUrl(ROUTES.guideArticle(article.slug))}): ${article.description}`).join("\n")}

## Ordering

- [Send an order request](${absoluteUrl(ROUTES.checkout)}): name, mobile number, city and delivery address.
- Jar sizes: ${getJarSizes()
    .map((size) => size.label)
    .join(", ")}.
- Currency: Pakistani rupees (PKR).

## Common questions

${commonQuestions}

## Optional

- [Full product, guide and FAQ details](${absoluteUrl("/llms-full.txt")})
`;
}

/** The buying guide as markdown, so AI assistants can read the full advice and not only the summary. */
function guideMarkdown(): string {
  const sections = GUIDE_SECTIONS.map((section) =>
    [`### ${section.heading}`, ...section.paragraphs, ...(section.points ?? []).map((point) => `- ${point}`)].join(
      "\n\n",
    ),
  ).join("\n\n");

  return `## ${GUIDE_TITLE}

URL: ${absoluteUrl(ROUTES.guide)}

${GUIDE_INTRO.join("\n\n")}

${sections}

### Guide questions

${GUIDE_FAQ.map((item) => `#### ${item.question}\n\n${item.answer}`).join("\n\n")}`;
}

/** One guide article as markdown, so AI assistants can read its full text. */
function articleMarkdown(article: GuideArticleContent): string {
  const sections = article.sections
    .map((section) =>
      [`#### ${section.heading}`, ...section.paragraphs, ...(section.points ?? []).map((point) => `- ${point}`)].join(
        "\n\n",
      ),
    )
    .join("\n\n");

  return `## ${article.title}

URL: ${absoluteUrl(ROUTES.guideArticle(article.slug))}

${article.intro.join("\n\n")}

${sections}

#### Guide questions

${article.faq.map((item) => `##### ${item.question}\n\n${item.answer}`).join("\n\n")}`;
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

${guideMarkdown()}

${ARTICLES.map(articleMarkdown).join("\n\n")}

## How ordering works

${ORDER_STEPS.map((step, index) => `${index + 1}. ${step.title} — ${step.body}`).join("\n")}

## Our promise

${PROMISES.map((promise) => `- ${promise.title}: ${promise.body}`).join("\n")}

## Frequently asked questions

${FAQ_ITEMS.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}
`;
}
