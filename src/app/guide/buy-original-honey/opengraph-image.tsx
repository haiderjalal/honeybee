import { HONEY_VARIETIES } from "@/constants/catalog";
import { OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const alt = "How to buy original honey in Pakistan";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function GuideOgImage() {
  return renderOgImage({
    eyebrow: "Honey guide",
    title: "How to buy original honey in Pakistan",
    subtitle: "Spot pure honey, check it at home, and order online.",
    palette: HONEY_VARIETIES[0].palette,
  });
}
