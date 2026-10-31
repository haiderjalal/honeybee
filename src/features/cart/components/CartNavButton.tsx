"use client";

import { ShoppingBag } from "lucide-react";

import { countJars, useCartStore } from "../store/cartStore";
import { useCartUiStore } from "../store/cartUiStore";

export function CartNavButton() {
  const count = useCartStore((state) => countJars(state.items));
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const openDrawer = useCartUiStore((state) => state.openDrawer);
  const showCount = hasHydrated && count > 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={showCount ? `Open your hive, ${count} ${count === 1 ? "jar" : "jars"}` : "Open your hive (cart)"}
      className="relative flex min-h-11 items-center gap-2 rounded-full border border-gold-400/30 px-4 text-sm text-cream-50 transition-colors hover:border-gold-300 hover:text-gold-300"
    >
      <ShoppingBag className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Hive</span>
      {showCount ? (
        <span className="grid min-w-6 place-items-center rounded-full bg-gold-400 px-1.5 text-xs font-bold text-ink-950 tabular-nums">
          {count}
        </span>
      ) : null}
    </button>
  );
}
