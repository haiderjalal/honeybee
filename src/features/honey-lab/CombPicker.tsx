"use client";

import { Honeycomb } from "@/components/art/Honeycomb";
import { getStartingPrice } from "@/services/catalog.service";
import { cn } from "@/utils/cn";
import { formatPkr } from "@/utils/formatPkr";
import { honeyStyle } from "@/utils/honeyStyle";

import type { HoneyVariety } from "@/types/catalog";

interface CombPickerProps {
  varieties: readonly HoneyVariety[];
  selectedSlug: string | null;
  harvesting: boolean;
  onPick: (slug: string) => void;
  registerComb: (slug: string, element: HTMLElement | null) => void;
}

export function CombPicker({ varieties, selectedSlug, harvesting, onPick, registerComb }: CombPickerProps) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:gap-8" aria-label="Honeycombs">
      {varieties.map((variety) => {
        const selected = variety.slug === selectedSlug;
        return (
          <li key={variety.slug}>
            <button
              type="button"
              onClick={() => onPick(variety.slug)}
              aria-pressed={selected}
              aria-label={`Harvest ${variety.name}`}
              disabled={harvesting}
              className={cn(
                "group flex w-full flex-col items-center gap-3 rounded-3xl border p-3 text-center transition-all duration-500 sm:p-6",
                "disabled:cursor-wait disabled:opacity-100",
                selected
                  ? "border-gold-400/70 bg-gold-400/10 shadow-[0_20px_60px_-20px_rgb(246_189_60/0.6)]"
                  : "border-cream-50/10 bg-forest-950/90 hover:-translate-y-1 hover:border-gold-400/40",
              )}
            >
              <span
                ref={(el) => registerComb(variety.slug, el)}
                className="block w-full max-w-36 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3"
                style={honeyStyle(variety.palette)}
              >
                <Honeycomb className="w-full" dripping={selected && harvesting} />
              </span>
              <span className="font-display text-lg leading-tight text-cream-50 sm:text-2xl">
                {variety.name.replace(" Honey", "")}
              </span>
              <span className="hidden text-sm text-cream-500 sm:block">
                {variety.localName} · from {formatPkr(getStartingPrice(variety))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
