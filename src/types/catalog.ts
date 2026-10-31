export type SizeId = "500g" | "1kg" | "2kg";

export interface JarSize {
  id: SizeId;
  label: string;
  grams: number;
  /** Relative visual scale of the jar artwork (2 kg = 1). */
  scale: number;
}

export interface HoneyPalette {
  light: string;
  base: string;
  deep: string;
}

export interface HoneyVariety {
  slug: string;
  name: string;
  localName: string;
  tagline: string;
  description: string;
  source: string;
  season: string;
  colour: string;
  texture: string;
  tastingNotes: string[];
  bestFor: string[];
  palette: HoneyPalette;
  prices: Record<SizeId, number>;
}

export interface PricedVariant {
  variety: HoneyVariety;
  size: JarSize;
  unitPrice: number;
}
