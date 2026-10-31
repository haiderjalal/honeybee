"use client";

import { Minus, Plus, X } from "lucide-react";

import { HoneyJar } from "@/components/art/HoneyJar";
import { MAX_QUANTITY_PER_LINE } from "@/constants/catalog";
import { getVarietyBySlug } from "@/services/catalog.service";
import { formatPkr } from "@/utils/formatPkr";
import { honeyStyle } from "@/utils/honeyStyle";

import { useCartStore, type CartLine } from "../store/cartStore";

interface CartLineItemProps {
  line: CartLine;
  editable?: boolean;
}

export function CartLineItem({ line, editable = true }: CartLineItemProps) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const variety = getVarietyBySlug(line.varietySlug);
  const itemName = `${line.name} ${line.sizeLabel}`;

  return (
    <li className="flex items-center gap-4 py-4">
      <div className="h-16 w-12 shrink-0" style={variety ? honeyStyle(variety.palette) : undefined}>
        <HoneyJar fill={0.85} className="size-full" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg text-cream-50">{line.name}</p>
        <p className="text-sm text-cream-500">
          {line.sizeLabel} · {formatPkr(line.unitPrice)}
        </p>

        {editable ? (
          <div className="mt-2 flex items-center gap-1" role="group" aria-label={`Quantity of ${itemName}`}>
            <button
              type="button"
              onClick={() => setQuantity(line.varietySlug, line.sizeId, line.quantity - 1)}
              disabled={line.quantity <= 1}
              aria-label={`Remove one ${itemName}`}
              className="grid size-9 place-items-center rounded-full border border-cream-500/30 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center tabular-nums" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(line.varietySlug, line.sizeId, line.quantity + 1)}
              disabled={line.quantity >= MAX_QUANTITY_PER_LINE}
              aria-label={`Add one more ${itemName}`}
              className="grid size-9 place-items-center rounded-full border border-cream-500/30 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="mt-1 text-sm text-cream-300">Qty {line.quantity}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="font-medium text-cream-50 tabular-nums">{formatPkr(line.lineTotal)}</p>
        {editable ? (
          <button
            type="button"
            onClick={() => removeItem(line.varietySlug, line.sizeId)}
            aria-label={`Remove ${itemName} from your hive`}
            className="grid size-9 place-items-center rounded-full text-cream-500 transition-colors hover:bg-cream-50/5 hover:text-danger"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </li>
  );
}
