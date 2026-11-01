import { HONEY_VARIETIES } from "@/constants/catalog";
import { OG_SIZE, renderOgImage } from "@/lib/seo/ogImage";

export const alt = "HonyB — raw Sidr, Acacia and Wildflower honey delivered across Pakistan";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Raw honey · Pakistan",
    title: "Liquid gold, straight from the hive.",
    subtitle: "Sidr · Acacia · Wildflower — 500 g, 1 kg & 2 kg",
    palette: HONEY_VARIETIES[0].palette,
  });
}
