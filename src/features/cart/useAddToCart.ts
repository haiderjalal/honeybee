"use client";

import { useCallback } from "react";

import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "@/constants/catalog";
import { getPricedVariant } from "@/services/catalog.service";

import { useCartStore, type AddResult } from "./store/cartStore";
import { useCartUiStore } from "./store/cartUiStore";

import type { SizeId } from "@/types/catalog";

/** Adds a jar to the cart and drives the shared feedback (hive pulse + screen-reader announcement). */
export function useAddToCart(): (varietySlug: string, sizeId: SizeId) => AddResult {
  const addItem = useCartStore((state) => state.addItem);
  const notifyAdded = useCartUiStore((state) => state.notifyAdded);

  return useCallback(
    (varietySlug, sizeId) => {
      const result = addItem(varietySlug, sizeId);
      const variant = getPricedVariant(varietySlug, sizeId);
      const name = variant ? `${variant.variety.name} ${variant.size.label}` : "Jar";

      if (result === "added") notifyAdded(`${name} added to your hive.`);
      if (result === "limit-reached") {
        notifyAdded(
          `Your hive is full — up to ${MAX_QUANTITY_PER_LINE} of each jar and ${MAX_CART_LINES} different jars per order.`,
        );
      }
      return result;
    },
    [addItem, notifyAdded],
  );
}
