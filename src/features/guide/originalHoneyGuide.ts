import { DELIVERY_CITIES } from "@/constants/delivery";
import { SITE } from "@/constants/site";

import type { FaqItem } from "@/constants/content";

export interface GuideSection {
  id: string;
  heading: string;
  paragraphs: readonly string[];
  points?: readonly string[];
}

/** The live host name, e.g. "honyb.musme.co", so the guide always names the site it is published on. */
const SITE_HOST = new URL(SITE.url).host;

export const GUIDE_UPDATED = "2026-11-05";

export const GUIDE_TITLE = "How to buy original honey in Pakistan";

export const GUIDE_DESCRIPTION =
  "How to spot pure honey, check it at home and buy original Sidr (beri), Acacia and Wildflower honey online, with delivery across Pakistan.";

export const GUIDE_INTRO: readonly string[] = [
  "Honey is easy to imitate, so buying the real thing takes a little care. This guide explains what original honey is, how to read a label, which home checks are worth doing and which are not, and what to ask a seller before you pay.",
];

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: "what-is-original-honey",
    heading: "What is original honey?",
    paragraphs: [
      "Original honey is honey and nothing else. Bees make it from nectar, and it should contain no added sugar, glucose, fructose or syrup.",
      "Raw honey is strained to remove wax and debris, but it is not heated or ultra-filtered, so it keeps its natural colour, aroma and texture.",
      "The main types in Pakistan are Sidr honey, also called beri or ber honey, which is dark and rich and comes from the blossoms of the sidr tree; Acacia honey, known locally as phulai, which is pale and mild; and Wildflower honey, which is bright and fruity.",
    ],
  },
  {
    id: "how-to-spot-real-honey",
    heading: "How to spot real honey before you buy",
    paragraphs: [
      "Start with the label. The ingredients should name only honey. If you see glucose syrup, fructose, invert sugar or corn syrup, the product is not pure honey, even when it is sold under a honey brand.",
      "Look for specifics. Pure honey is usually sold with its variety, its region, its harvest season and a batch or lot number. A jar labelled only 'honey' gives you nothing to check.",
      "Be wary of price. Sidr and Acacia honey cost more to produce than sugar syrup, so a jar sold far below the usual price for its variety is a warning sign.",
      "Expect some variation. Honey changes with the flowers and the season, so its colour, aroma and taste can differ from one batch to the next. Generic honey that tastes exactly the same every time deserves a closer look.",
    ],
  },
  {
    id: "checks-you-can-do-at-home",
    heading: "Simple checks you can do at home",
    paragraphs: [
      "Home checks can flag an obvious fake, but none of them proves that honey is pure. Use them alongside the label, the origin details and the seller's reputation.",
    ],
    points: [
      "Water test: drop a spoonful of honey into a glass of water. Pure honey usually sinks and holds together for a while, while a thin syrup tends to dissolve quickly. Compare it with a jar you know is pure.",
      "Texture test: pure honey is thick and sticky, and it falls slowly from a spoon. Acacia honey stays runny for a long time, so use this test together with the others.",
      "Crystallisation: many pure honeys crystallise over time. This is natural and is not a sign of spoilage. Liquid honey is not proof of a fake either, because some honey stays liquid for a long time.",
    ],
  },
  {
    id: "tests-that-do-not-work",
    heading: "Tests that do not work, and what does",
    paragraphs: [
      "Some popular tests do not work. The matchstick or flame test, the vinegar test and the bread test do not reliably separate pure honey from syrup, so do not rely on them.",
      "For real certainty, ask for a lab report. Laboratories can test honey for added sugar and syrups. A seller who shares an independent test report is giving you evidence, not just a promise.",
    ],
  },
  {
    id: "questions-to-ask-a-seller",
    heading: "Questions to ask before you buy",
    paragraphs: ["Any seller should be able to answer these questions quickly and clearly."],
    points: [
      "Is this honey made only from honey, with nothing added?",
      "Which flower and region is it from, and when was it harvested?",
      "Does each batch have a batch number, and can you share a lab report for it?",
      "How is it sealed and stored before delivery?",
      "What happens if I am not happy with the honey?",
    ],
  },
  {
    id: "how-honyb-handles-original-honey",
    heading: "How HonyB handles original honey",
    paragraphs: [
      "HonyB sells raw Sidr (beri), Acacia (phulai) and Wildflower honey in 500 g, 1 kg and 2 kg jars. Every honey we sell is original, pure and natural, and each jar is sealed after pouring.",
      "A real person confirms every order with you by phone or WhatsApp before it ships, so you know what you are paying for. No payment is taken on the website.",
      "We offer a lifetime warranty on our honey. If you find something wrong with your honey, we give you a refund.",
    ],
  },
  {
    id: "storing-and-using-honey",
    heading: "How to store honey and use it safely",
    paragraphs: [
      "Keep the jar tightly closed at room temperature, away from direct sunlight and moisture, and always use a clean, dry spoon. Moisture can make honey ferment over time.",
      "Do not give honey to babies under one year old. Honey can carry bacteria that cause infant botulism, which is dangerous for infants.",
    ],
  },
  {
    id: "buying-original-honey-online",
    heading: "Buying original honey online in Pakistan",
    paragraphs: [
      "Buying online is convenient when you can check the seller first. Look at the variety, the jar size, the price, and how the seller handles delivery and returns before you send an order.",
      `Order at ${SITE_HOST}: pick your honey and jar size, add it to your hive, and send an order request with your name, mobile number, city and address. Our team calls or WhatsApps you to confirm delivery and payment.`,
    ],
  },
  {
    id: "delivery-across-pakistan",
    heading: "Delivery across Pakistan",
    paragraphs: [
      `Looking for pure honey in Islamabad, Rawalpindi or Peshawar? We deliver across Pakistan, including ${DELIVERY_CITIES.join(", ")}.`,
      "Send your city with your order request. We confirm the delivery time and any delivery charge when we call you.",
      "If your town is not on this list, send your order anyway and we will tell you whether we can deliver there.",
    ],
  },
];

export const GUIDE_FAQ: readonly FaqItem[] = [
  {
    question: "Where can I buy original honey online in Pakistan?",
    answer: `Choose a seller that names the variety, origin and price, and that confirms each order before it ships. HonyB sells raw Sidr (beri), Acacia and Wildflower honey online at ${SITE_HOST}, with delivery across Pakistan.`,
  },
  {
    question: "What is the best online honey in Pakistan?",
    answer: `The best honey is the one that suits your taste. Sidr is dark and rich, Acacia is pale and mild, and Wildflower is bright and fruity. HonyB sells all three, so you can compare them at ${SITE_HOST}.`,
  },
  {
    question: "Where can I buy the best online honey in Islamabad, Rawalpindi or Peshawar?",
    answer:
      "HonyB delivers across Pakistan, including Islamabad, Rawalpindi and Peshawar. Choose your honey, send your order request with your city, and we confirm delivery when we call.",
  },
  {
    question: "Is online honey delivered to Batkhela, Chakdara, Thana, Malakand and Swat?",
    answer:
      "Yes. HonyB delivers to these towns as part of our delivery across Pakistan. Send your town with your order request, and we confirm the delivery time and any charge when we call.",
  },
  {
    question: "How can I tell if honey is pure?",
    answer:
      "Read the label for added sugars, check for the variety, origin and harvest details, and ask the seller for a lab report. Home tests can flag an obvious fake but cannot prove purity.",
  },
  {
    question: "Is Sidr honey the same as berry honey?",
    answer:
      "Sidr honey is also called berry honey or beri honey. It comes from the blossoms of the sidr (beri) tree, which is also known as the ber tree.",
  },
  {
    question: "Why does honey crystallise?",
    answer:
      "Crystallisation is a natural process in raw honey and does not mean the honey has spoiled. Stand the closed jar in warm water, not boiling water, and stir until it is liquid again.",
  },
  {
    question: "Can babies have honey?",
    answer: "No. Do not give honey to babies under one year old.",
  },
];
