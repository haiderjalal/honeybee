"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useAddToCart } from "@/features/cart/useAddToCart";
import { useCartUiStore } from "@/features/cart/store/cartUiStore";
import { cn } from "@/utils/cn";
import { formatPkr } from "@/utils/formatPkr";

import type { HoneyVariety, JarSize, SizeId } from "@/types/catalog";

interface AddToHivePanelProps {
  variety: HoneyVariety;
  sizes: readonly JarSize[];
}

export function AddToHivePanel({ variety, sizes }: AddToHivePanelProps) {
  const [sizeId, setSizeId] = useState<SizeId>("1kg");
  const [added, setAdded] = useState(false);
  const addToCart = useAddToCart();
  const openDrawer = useCartUiStore((state) => state.openDrawer);

  const add = () => {
    if (addToCart(variety.slug, sizeId) !== "added") return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-cream-300">Choose a jar</legend>
        <div className="grid grid-cols-3 gap-3">
          {sizes.map((size) => {
            const checked = size.id === sizeId;
            return (
              <label
                key={size.id}
                className={cn(
                  "flex cursor-pointer flex-col items-center rounded-2xl border px-3 py-4 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-gold-300",
                  checked ? "border-gold-400 bg-gold-400/10" : "border-cream-50/15 hover:border-gold-400/50",
                )}
              >
                <input
                  type="radio"
                  name="jar-size"
                  value={size.id}
                  checked={checked}
                  onChange={() => setSizeId(size.id)}
                  className="visually-hidden"
                />
                <span className="font-display text-xl text-cream-50">{size.label}</span>
                <span className="text-sm text-cream-300 tabular-nums">{formatPkr(variety.prices[size.id])}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={add} className="min-w-52 flex-1">
          {added ? <Check className="size-5" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
          {added ? "Added to your hive" : `Add to hive · ${formatPkr(variety.prices[sizeId])}`}
        </Button>
        <Button size="lg" variant="secondary" onClick={openDrawer}>
          View hive
        </Button>
      </div>
    </div>
  );
}
