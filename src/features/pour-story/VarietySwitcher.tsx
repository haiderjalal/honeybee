"use client";

import { cn } from "@/utils/cn";

import type { HoneyVariety } from "@/types/catalog";

interface VarietySwitcherProps {
  varieties: readonly HoneyVariety[];
  value: string;
  onChange: (slug: string) => void;
}

/** Radio group styled as honey-coloured chips. */
export function VarietySwitcher({ varieties, value, onChange }: VarietySwitcherProps) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="visually-hidden">Choose a honey to pour</legend>
      {varieties.map((variety) => {
        const checked = variety.slug === value;
        return (
          <label
            key={variety.slug}
            className={cn(
              "relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-gold-300",
              checked
                ? "border-gold-400 bg-gold-400/15 text-cream-50"
                : "border-cream-50/15 text-cream-300 hover:border-gold-400/50",
            )}
          >
            <input
              type="radio"
              name="pour-variety"
              value={variety.slug}
              checked={checked}
              onChange={() => onChange(variety.slug)}
              className="visually-hidden"
            />
            <span
              aria-hidden="true"
              className="size-3 rounded-full ring-1 ring-white/30"
              style={{ background: `linear-gradient(135deg, ${variety.palette.light}, ${variety.palette.deep})` }}
            />
            {variety.name.replace(" Honey", "")}
          </label>
        );
      })}
    </fieldset>
  );
}
