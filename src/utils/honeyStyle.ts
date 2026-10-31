import type { CSSProperties } from "react";

import type { HoneyPalette } from "@/types/catalog";

/** CSS custom properties that recolour every honey artwork beneath the element. */
export function honeyStyle(palette: HoneyPalette): CSSProperties {
  return {
    "--honey-light": palette.light,
    "--honey-base": palette.base,
    "--honey-deep": palette.deep,
  } as CSSProperties;
}
