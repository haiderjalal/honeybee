import { hexPointsAttr } from "@/utils/hex";

const ITEMS = [
  "Sidr Honey",
  "Acacia Honey",
  "Wildflower Honey",
  "500 g",
  "1 kg",
  "2 kg",
  "Raw & unfiltered",
  "Sealed fresh",
  "Delivered across Pakistan",
];

function Sparkle() {
  return (
    <svg viewBox="0 0 40 40" className="size-5 shrink-0 text-gold-400" aria-hidden="true" focusable="false">
      <polygon points={hexPointsAttr(20, 20, 16)} fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points={hexPointsAttr(20, 20, 6)} fill="currentColor" />
    </svg>
  );
}

function Group() {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {ITEMS.map((item) => (
        <span key={item} className="flex shrink-0 items-center gap-8">
          <span className="font-display text-3xl font-medium whitespace-nowrap text-cream-100 italic sm:text-4xl">
            {item}
          </span>
          <Sparkle />
        </span>
      ))}
    </div>
  );
}

/**
 * Endless ticker of the product line. The list is rendered twice and the track moves by exactly
 * half its width, so the loop is seamless. Decorative: the same facts appear in the page content.
 */
export function Marquee() {
  return (
    <section aria-hidden="true" className="relative overflow-hidden border-y border-gold-400/15 bg-forest-950 py-6">
      <div className="marquee-track">
        <Group />
        <Group />
      </div>
    </section>
  );
}
