import type { FaqItem } from "@/constants/content";
import type { GuideSection } from "@/features/guide/originalHoneyGuide";

export interface GuideArticleContent {
  slug: string;
  title: string;
  description: string;
  /** Short line for the share image. */
  shareLine: string;
  intro: readonly string[];
  sections: readonly GuideSection[];
  faq: readonly FaqItem[];
  updated: string;
}

const UPDATED = "2026-11-05";

export const ARTICLES: readonly GuideArticleContent[] = [
  {
    slug: "sidr-acacia-wildflower",
    title: "Sidr, Acacia or Wildflower: which honey to choose",
    description:
      "Compare Sidr (beri), Acacia (phulai) and Wildflower honey by colour, texture, taste and use, and learn how to choose the right one.",
    shareLine: "Sidr, Acacia or Wildflower? Compare colour, taste and use.",
    updated: UPDATED,
    intro: [
      "Pakistan's three most common honeys look and taste different because bees visit different flowers. This guide compares them using the same descriptions we give on our product pages, so you can choose by taste and use.",
    ],
    sections: [
      {
        id: "sidr-honey-in-brief",
        heading: "Sidr (beri) honey",
        paragraphs: [
          "Sidr honey comes from the blossoms of the sidr tree, which is known locally as beri. It is dark amber and thick, with a rich caramel depth, toasted malt notes and a long, buttery finish.",
          "People often choose Sidr for a morning spoonful, for warm water with lemon, or as a gift, because its flavour is deep enough to stand out.",
        ],
      },
      {
        id: "acacia-honey-in-brief",
        heading: "Acacia (phulai) honey",
        paragraphs: [
          "Acacia honey comes from the spring blossoms of the phulai tree. It is pale gold, light and clear, with a delicate floral taste and soft vanilla notes.",
          "Acacia honey stays runny for a long time, so it pours easily into tea. Many families also choose it for children, because its taste is mild.",
        ],
      },
      {
        id: "wildflower-honey-in-brief",
        heading: "Wildflower honey",
        paragraphs: [
          "Wildflower honey is made from the mixed blooms bees find across open fields and orchards. Its colour is golden, its texture smooth and flowing, and its taste is bright and fruity with gentle herbal notes.",
          "It suits everyday cooking, baking, smoothies and drinks, where a clear, fruity sweetness works well.",
        ],
      },
      {
        id: "side-by-side",
        heading: "Side by side",
        paragraphs: [
          "The points below sum up the main differences. Honey changes with the season and the region, so a batch can differ a little from these descriptions.",
        ],
        points: [
          "Colour: Sidr is dark amber, Acacia is pale gold, and Wildflower is golden.",
          "Texture: Sidr is thick and velvety, Acacia is light and silky and stays runny, and Wildflower is smooth and flowing.",
          "Taste: Sidr has caramel and toasted malt notes, Acacia has spring blossom and soft vanilla, and Wildflower has ripe fruit and meadow herbs.",
          "Best for: Sidr for a morning spoonful and gifting, Acacia for tea, children and yoghurt, and Wildflower for cooking, baking and smoothies.",
        ],
      },
      {
        id: "how-to-choose",
        heading: "How to choose",
        paragraphs: [
          "Start with taste. If you want a deep, rich honey, choose Sidr. If you want something mild for tea or for children, choose Acacia. If you cook or bake often, Wildflower is the practical choice.",
          "Prices differ by variety and by jar size, so check the product pages for the current price of each.",
        ],
      },
    ],
    faq: [
      {
        question: "Which honey is good for tea?",
        answer:
          "Acacia honey is a common choice for tea, because it is light, mild and stays runny. Sidr is darker and richer, so it gives a stronger flavour in tea.",
      },
      {
        question: "Is Sidr honey the same as beri honey?",
        answer:
          "In Pakistan, sidr honey is commonly called beri honey, because the sidr tree is known locally as beri.",
      },
      {
        question: "Which honey is suitable for children?",
        answer: "Acacia honey is usually the mildest of the three. Do not give honey to babies under one year old.",
      },
    ],
  },
  {
    slug: "why-honey-crystallises",
    title: "Why honey crystallises, and what to do about it",
    description:
      "Why pure honey turns grainy or solid over time, why that does not mean it has spoiled, and how to return it to liquid safely at home.",
    shareLine: "Grainy honey is not spoiled honey. Here is why.",
    updated: UPDATED,
    intro: [
      "Crystallisation is one of the most common questions about honey. A jar that turns grainy or solid can look like a problem, but in most cases it is a sign that the honey is natural.",
    ],
    sections: [
      {
        id: "what-crystallisation-is",
        heading: "What crystallisation is",
        paragraphs: [
          "Honey is a mix of sugars dissolved in a small amount of water. Its two main sugars are glucose and fructose. Glucose can come out of the solution and form crystals, which is what makes honey grainy or firm.",
          "The process is slow. Its speed depends on the honey's sugar balance, its moisture and the temperature it is stored at.",
        ],
      },
      {
        id: "not-a-sign-of-spoilage",
        heading: "Why it does not mean the honey has spoiled",
        paragraphs: [
          "Crystallisation does not mean honey has gone bad. Pure honey can stay liquid for months or crystallise within weeks, depending on its flowers and how it is stored.",
          "Honeys with more glucose tend to crystallise sooner. Acacia honey stays liquid for longer, because it contains more fructose.",
        ],
      },
      {
        id: "crystallisation-and-purity",
        heading: "What it does and does not tell you about purity",
        paragraphs: [
          "Crystallisation is not proof that honey is pure, and liquid honey is not proof that it is fake. Crystallisation alone does not tell you whether honey has been mixed with syrup.",
          "To judge purity, look at the label, the origin details and, where possible, a lab report for the batch.",
        ],
      },
      {
        id: "how-to-return-it-to-liquid",
        heading: "How to make crystallised honey liquid again",
        paragraphs: [
          "Stand the closed jar in warm water, not boiling water, and stir gently until the honey is liquid again. A large jar can take a while.",
          "Avoid the microwave and high heat. Overheating can change the honey's flavour and aroma.",
        ],
      },
      {
        id: "how-to-slow-it-down",
        heading: "How to slow it down",
        paragraphs: [
          "Keep honey at room temperature, in a closed jar, away from sunlight. Do not store it in a refrigerator, because cold temperatures speed up crystallisation.",
          "Always use a clean, dry spoon, because moisture from a wet spoon can start fermentation over time.",
        ],
      },
      {
        id: "crystallised-honey-is-safe",
        heading: "Crystallised honey is still safe to eat",
        paragraphs: [
          "Crystallised honey is safe to eat. You can spread it on bread, stir it into tea, or warm the jar as described above to make it liquid again.",
        ],
      },
    ],
    faq: [
      {
        question: "Does crystallised honey go bad?",
        answer:
          "No. Crystallisation is natural and does not mean the honey has spoiled. Crystallised honey is still safe to eat.",
      },
      {
        question: "Why did my honey crystallise so quickly?",
        answer:
          "Honey crystallises faster when it has more glucose, or when it is stored cold. The flower source plays a large role.",
      },
      {
        question: "Is it safe to heat honey to make it liquid?",
        answer:
          "Warm it gently in warm water, not boiling water. Avoid the microwave and high heat, which can change its flavour and aroma.",
      },
    ],
  },
  {
    slug: "how-honey-quality-is-tested",
    title: "How honey quality is tested in a lab",
    description:
      "What a honey lab test checks for, such as moisture, HMF, diastase and added syrups, and how to read a lab report before you buy.",
    shareLine: "What honey lab tests check, and how to read a report.",
    updated: UPDATED,
    intro: [
      "Honey is valuable and easy to adulterate, so laboratories run several tests to check whether it is pure, whether it has been heated or stored badly, and whether it has been mixed with syrup. This guide explains the main tests and how to read a report.",
    ],
    sections: [
      {
        id: "why-labs-test-honey",
        heading: "Why labs test honey",
        paragraphs: [
          "Some sellers mix honey with cheaper sugar syrups, and honey that is heated or kept for a long time can lose quality. Laboratory tests help identify both problems.",
          "A lab test is only as useful as the batch it covers, so the report and the jar should match.",
        ],
      },
      {
        id: "tests-on-a-report",
        heading: "The tests you may see on a report",
        paragraphs: ["Reports vary, but these are the tests you are most likely to see."],
        points: [
          "Moisture: honey with too much water can ferment. Most honey standards set a maximum moisture level.",
          "HMF (hydroxymethylfurfural): builds up when honey is heated or stored for a long time, so a high value suggests overheating or age.",
          "Diastase activity: an enzyme that falls when honey is heated, so low activity can suggest that the honey has been heated.",
          "Sugar profile or isotope analysis: detects sugars made from plants such as corn or cane, which are often used in syrups.",
          "Pollen analysis: shows which flowers the honey came from, which helps confirm a variety.",
        ],
      },
      {
        id: "reading-a-lab-report",
        heading: "How to read a lab report",
        paragraphs: [
          "Check that the batch number and date on the report match the jar you are buying. Look for the name of the laboratory and whether it is accredited. Each test should show a result and the limit it was checked against.",
          "A report that covers only one test tells you very little. Look for several tests, and for sugar analysis in particular if syrup is a concern.",
        ],
      },
      {
        id: "what-a-report-cannot-tell-you",
        heading: "What a lab report cannot tell you",
        paragraphs: [
          "A report shows the batch that was tested. It does not prove that other batches are the same, unless each batch is tested.",
          "Ask the seller whether the test was done on the batch you are buying, and how often batches are tested.",
        ],
      },
      {
        id: "labs-and-home-checks",
        heading: "Labs and home checks",
        paragraphs: [
          "Home checks can flag an obvious fake, but they cannot identify most adulteration. Laboratory tests are the reliable way to check for syrups and heat damage. Our buying guide explains the simple checks and their limits.",
        ],
      },
    ],
    faq: [
      {
        question: "What is a honey lab test?",
        answer:
          "A lab test measures properties such as moisture, HMF, diastase activity and sugar profile, to check whether honey is pure and whether it has been heated or mixed with syrup.",
      },
      {
        question: "Is a lab report proof that honey is pure?",
        answer:
          "A report from an accredited laboratory is strong evidence for the batch it covers. It does not prove that other batches are the same.",
      },
      {
        question: "What does HMF mean on a honey report?",
        answer:
          "HMF stands for hydroxymethylfurfural. A high level suggests that the honey was heated or stored for a long time.",
      },
    ],
  },
];

export function getArticle(slug: string): GuideArticleContent | null {
  return ARTICLES.find((article) => article.slug === slug) ?? null;
}
