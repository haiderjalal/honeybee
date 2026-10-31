/** Marketing copy shared by the UI, structured data and llms.txt. */

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "How do I place an order?",
    answer:
      "Choose a honey, drop the jars you want into your hive (cart) and send the order request with your name, phone number and address. We call or WhatsApp you to confirm the order, delivery and payment — nothing is charged on the website.",
  },
  {
    question: "Do you deliver across Pakistan?",
    answer:
      "Yes. Send your city with the order request and we confirm the delivery time and any delivery charge when we call you.",
  },
  {
    question: "Which honey should I choose?",
    answer:
      "Sidr (beri) is dark, rich and caramel-like — a premium choice and a popular gift. Acacia (phulai) is light, floral and mild, ideal for tea and children. Wildflower is bright and fruity, an everyday honey for cooking and baking.",
  },
  {
    question: "Which jar sizes are available?",
    answer: "Every honey comes in 500 g, 1 kg and 2 kg jars. You can mix varieties and sizes in one order.",
  },
  {
    question: "Why does honey sometimes crystallise?",
    answer:
      "Crystallisation is a natural process in raw honey and does not mean it has spoiled. Stand the closed jar in warm (not boiling) water and stir until it turns liquid again.",
  },
  {
    question: "How should I store honey?",
    answer:
      "Keep the jar tightly closed at room temperature, away from direct sunlight and moisture. Always use a clean, dry spoon.",
  },
];

export const ORDER_STEPS = [
  { title: "Pick your honey", body: "Tap a honeycomb in the Honey Lab and watch the bee fill your jars." },
  { title: "Drop jars in your hive", body: "Drag a 500 g, 1 kg or 2 kg jar into the hive — or tap Add to hive." },
  { title: "Send your order request", body: "Share your name, phone and address. It takes under a minute." },
  { title: "We confirm with you", body: "Our team calls or WhatsApps you to confirm delivery and payment." },
  { title: "Delivered to your door", body: "Your jars are sealed and sent to your address." },
] as const;

export const PROMISES = [
  {
    id: "raw",
    title: "Raw and unfiltered",
    body: "Never blended with syrups. Just honey, the way the hive made it.",
  },
  {
    id: "varieties",
    title: "Three true varieties",
    body: "Sidr, Acacia and Wildflower — each with its own colour, aroma and character.",
  },
  {
    id: "sealed",
    title: "Sealed fresh",
    body: "Every jar is sealed after pouring so it reaches you exactly as packed.",
  },
  {
    id: "confirmation",
    title: "Personal confirmation",
    body: "A real person confirms every order with you before it ships.",
  },
] as const;
