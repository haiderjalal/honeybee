import type { HoneyVariety, JarSize, SizeId } from "@/types/catalog";

/**
 * Single source of truth for products and prices (PKR).
 * Edit this file to change varieties, copy or prices — the UI, emails,
 * structured data and llms.txt all read from here.
 */

export const SIZE_IDS = ["500g", "1kg", "2kg"] as const satisfies readonly SizeId[];

export const JAR_SIZES: readonly JarSize[] = [
  { id: "500g", label: "500 g", grams: 500, scale: 0.66 },
  { id: "1kg", label: "1 kg", grams: 1000, scale: 0.82 },
  { id: "2kg", label: "2 kg", grams: 2000, scale: 1 },
];

export const HONEY_VARIETIES: readonly HoneyVariety[] = [
  {
    slug: "sidr-honey",
    name: "Sidr Honey",
    localName: "Beri",
    tagline: "Dark, velvety and deeply caramel.",
    description:
      "Sidr honey is gathered from the blossoms of the sidr (beri) tree. It pours dark amber and thick, with a rich caramel depth and a long, buttery finish — the honey people reach for when they want something special.",
    source: "Sidr (beri) tree blossoms — Ziziphus",
    season: "Autumn harvest",
    colour: "Dark amber",
    texture: "Thick and velvety",
    tastingNotes: ["Caramel", "Toasted malt", "Buttery finish"],
    bestFor: ["A morning spoonful", "Warm water and lemon", "Gifting"],
    palette: { light: "#f3a943", base: "#b9650f", deep: "#5e2905" },
    prices: { "500g": 3200, "1kg": 6000, "2kg": 11500 },
  },
  {
    slug: "acacia-honey",
    name: "Acacia Honey",
    localName: "Phulai",
    tagline: "Pale gold, floral and gentle.",
    description:
      "Acacia honey comes from the spring blossoms of the phulai tree. It is light, clear and delicately floral with soft vanilla notes, and it stays runny for a long time — perfect for tea and for children who like a milder honey.",
    source: "Phulai (acacia) blossoms — Acacia modesta",
    season: "Spring harvest",
    colour: "Pale gold",
    texture: "Light and silky",
    tastingNotes: ["Spring blossom", "Soft vanilla", "Clean sweetness"],
    bestFor: ["Tea and green tea", "Children", "Yoghurt and breakfast"],
    palette: { light: "#ffe6a0", base: "#f0c24f", deep: "#b07e12" },
    prices: { "500g": 1900, "1kg": 3600, "2kg": 6900 },
  },
  {
    slug: "wildflower-honey",
    name: "Wildflower Honey",
    localName: "Multi-floral",
    tagline: "Golden, bright and full of meadow.",
    description:
      "Wildflower honey is made from the mixed blooms bees find across open fields and orchards. Every batch carries a bright, fruity character with gentle herbal notes — an everyday honey for cooking, baking and smoothies.",
    source: "Mixed seasonal wildflowers",
    season: "Spring and summer harvest",
    colour: "Golden",
    texture: "Smooth and flowing",
    tastingNotes: ["Ripe fruit", "Meadow herbs", "Bright finish"],
    bestFor: ["Everyday cooking", "Baking", "Smoothies and drinks"],
    palette: { light: "#ffc960", base: "#e2901a", deep: "#8f4f07" },
    prices: { "500g": 1500, "1kg": 2800, "2kg": 5400 },
  },
];

export const MAX_QUANTITY_PER_LINE = 20;
export const MAX_CART_LINES = 15;
