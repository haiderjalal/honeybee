import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "@/constants/catalog";
import { getPricedVariant } from "@/services/catalog.service";

import type { SizeId } from "@/types/catalog";

export interface CartItem {
  varietySlug: string;
  sizeId: SizeId;
  quantity: number;
}

export type AddResult = "added" | "limit-reached" | "unknown-product";

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (varietySlug: string, sizeId: SizeId, quantity?: number) => AddResult;
  setQuantity: (varietySlug: string, sizeId: SizeId, quantity: number) => void;
  removeItem: (varietySlug: string, sizeId: SizeId) => void;
  clear: () => void;
}

const isSameLine = (item: CartItem, varietySlug: string, sizeId: SizeId): boolean =>
  item.varietySlug === varietySlug && item.sizeId === sizeId;

const clampQuantity = (quantity: number): number => Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Math.floor(quantity)));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      addItem: (varietySlug, sizeId, quantity = 1) => {
        if (!getPricedVariant(varietySlug, sizeId)) return "unknown-product";

        const { items } = get();
        const existing = items.find((item) => isSameLine(item, varietySlug, sizeId));

        if (existing) {
          if (existing.quantity >= MAX_QUANTITY_PER_LINE) return "limit-reached";
          set({
            items: items.map((item) =>
              item === existing ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item,
            ),
          });
          return "added";
        }

        if (items.length >= MAX_CART_LINES) return "limit-reached";
        set({ items: [...items, { varietySlug, sizeId, quantity: clampQuantity(quantity) }] });
        return "added";
      },

      setQuantity: (varietySlug, sizeId, quantity) =>
        set(({ items }) => ({
          items: items.map((item) =>
            isSameLine(item, varietySlug, sizeId) ? { ...item, quantity: clampQuantity(quantity) } : item,
          ),
        })),

      removeItem: (varietySlug, sizeId) =>
        set(({ items }) => ({ items: items.filter((item) => !isSameLine(item, varietySlug, sizeId)) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "honeybee-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ items }) => ({ items }),
      // Hydrate manually after mount so server and first client render match.
      skipHydration: true,
      // Drop anything the catalogue no longer sells (e.g. after a product change).
      merge: (persisted, current) => {
        const stored = (persisted as Partial<CartState> | undefined)?.items ?? [];
        const items = stored
          .filter((item) => getPricedVariant(item.varietySlug, item.sizeId))
          .slice(0, MAX_CART_LINES)
          .map((item) => ({ ...item, quantity: clampQuantity(item.quantity) }));
        return { ...current, items };
      },
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export interface CartLine extends CartItem {
  name: string;
  sizeLabel: string;
  unitPrice: number;
  lineTotal: number;
}

/** Joins cart items with catalogue data. Prices always come from the catalogue. */
export function toCartLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const variant = getPricedVariant(item.varietySlug, item.sizeId);
    if (!variant) return [];
    return [
      {
        ...item,
        name: variant.variety.name,
        sizeLabel: variant.size.label,
        unitPrice: variant.unitPrice,
        lineTotal: variant.unitPrice * item.quantity,
      },
    ];
  });
}

export function calculateSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function countJars(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
