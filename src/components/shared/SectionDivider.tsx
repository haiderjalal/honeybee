import { hexPointsAttr } from "@/utils/hex";

/** Decorative break between page sections: a gold rule on each side of a honeycomb mark. */
export function SectionDivider() {
  return (
    <div aria-hidden="true" className="my-16 flex items-center gap-4 sm:my-24">
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-gold-400/80" />
      <svg viewBox="0 0 40 40" className="size-6 shrink-0 text-gold-400" focusable="false">
        <polygon points={hexPointsAttr(20, 20, 16)} fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points={hexPointsAttr(20, 20, 7)} fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-linear-to-r from-gold-400/80 to-transparent" />
    </div>
  );
}
