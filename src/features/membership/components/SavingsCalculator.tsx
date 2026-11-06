"use client";

import { useState } from "react";

import { SelectField, InputField } from "@/components/ui/Field";
import { JAR_SIZES, MAX_QUANTITY_PER_LINE } from "@/constants/catalog";
import { MEMBERSHIP } from "@/constants/membership";
import { getBelowMinimumCopy, MEMBERSHIP_COPY } from "@/constants/membershipContent";
import { quoteMembershipDiscount } from "@/services/membership/membershipDiscount";
import { formatPkr, formatPkrMinor } from "@/utils/formatPkr";
import { rupeesToMinor } from "@/utils/money";

import type { HoneyVariety, SizeId } from "@/types/catalog";

/** The catalogue fields the calculator needs. Prices are read from the catalogue, never typed in. */
export type CalculatorVariety = Pick<HoneyVariety, "slug" | "name" | "prices" | "listPrices">;

interface SavingsCalculatorProps {
  varieties: readonly CalculatorVariety[];
}

/**
 * The first jar shown. Wildflower 2 kg is at regular price and above the minimum, so the first view shows a saving
 * rather than a sale jar that membership cannot discount.
 */
const DEFAULT_VARIETY_SLUG = "wildflower-honey";
const DEFAULT_SIZE_ID: SizeId = "2kg";

const feeText = formatPkrMinor(MEMBERSHIP.feeMinor);
const maxDiscountText = formatPkr(MEMBERSHIP.maxDiscountPerOrderMinor / 100);
const discountPercentText = `${MEMBERSHIP.discountRateBps / 100}%`;

function clampQuantity(value: string): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, parsed));
}

/**
 * Estimates what membership saves on one basket at today's prices. It runs the same discount rules as checkout, so
 * the number shown here matches what an order would receive. Checkout remains the authority on the real price.
 */
export function SavingsCalculator({ varieties }: SavingsCalculatorProps) {
  const [varietySlug, setVarietySlug] = useState(
    varieties.some((item) => item.slug === DEFAULT_VARIETY_SLUG) ? DEFAULT_VARIETY_SLUG : (varieties[0]?.slug ?? ""),
  );
  const [sizeId, setSizeId] = useState<SizeId>(DEFAULT_SIZE_ID);
  const [quantity, setQuantity] = useState(1);

  const variety = varieties.find((item) => item.slug === varietySlug) ?? varieties[0];
  if (!variety) return null;

  const unitPrice = variety.prices[sizeId];
  const listPrice = variety.listPrices?.[sizeId];
  const onSale = listPrice !== undefined && listPrice > unitPrice;
  const lineTotalMinor = rupeesToMinor(unitPrice) * quantity;

  const quote = quoteMembershipDiscount([{ id: "basket-line", kind: "honey", lineTotalMinor, onSale }]);
  const savingMinor = quote.discountMinor;
  const ordersToRecoverFee = savingMinor > 0 ? Math.ceil(MEMBERSHIP.feeMinor / savingMinor) : null;
  const sixOrderSavingMinor = savingMinor * MEMBERSHIP.discountAllowance;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div className="flex flex-col gap-5 rounded-3xl border border-cream-50/10 bg-forest-900/60 p-6 sm:p-8">
        <SelectField
          id="calc-variety"
          label="Honey"
          value={variety.slug}
          onChange={(event) => setVarietySlug(event.target.value)}
        >
          {varieties.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="calc-size"
          label="Jar size"
          value={sizeId}
          onChange={(event) => setSizeId(event.target.value as SizeId)}
        >
          {JAR_SIZES.map((size) => (
            <option key={size.id} value={size.id}>
              {size.label} — {formatPkr(variety.prices[size.id])}
            </option>
          ))}
        </SelectField>

        <InputField
          id="calc-quantity"
          label="Jars in one order"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QUANTITY_PER_LINE}
          value={quantity}
          onChange={(event) => setQuantity(clampQuantity(event.target.value))}
        />
      </div>

      <div
        aria-live="polite"
        className="flex flex-col gap-4 rounded-3xl border border-gold-400/20 bg-forest-800/60 p-6 sm:p-8"
      >
        <p className="text-cream-300">
          Basket at today&apos;s price:{" "}
          <strong className="text-cream-50 tabular-nums">{formatPkrMinor(lineTotalMinor)}</strong>
        </p>

        {savingMinor > 0 ? (
          <>
            <p className="text-cream-100">
              Member saving on this order:{" "}
              <strong className="font-display text-3xl text-gold-300 tabular-nums" data-testid="calc-saving">
                {formatPkrMinor(savingMinor)}
              </strong>
            </p>
            <p className="text-sm text-cream-500">
              {discountPercentText} of the regular-price honey subtotal
              {quote.capped ? `, capped at ${maxDiscountText} per order` : ""}.
            </p>
            <p className="text-cream-100">
              {ordersToRecoverFee} {ordersToRecoverFee === 1 ? "order" : "orders"} like this recover the {feeText} fee
              through discounts.
            </p>
            <p className="text-cream-300">
              Up to {MEMBERSHIP.discountAllowance} orders like this would save {formatPkrMinor(sixOrderSavingMinor)}{" "}
              before the fee, or {formatPkrMinor(sixOrderSavingMinor - MEMBERSHIP.feeMinor)} after it.
            </p>
          </>
        ) : (
          <p className="text-cream-300" data-testid="calc-outcome">
            {onSale
              ? "This jar is on sale. Membership discounts do not combine with sale prices."
              : getBelowMinimumCopy(MEMBERSHIP.minEligibleSubtotalMinor - lineTotalMinor)}
          </p>
        )}

        <p className="mt-auto text-xs text-cream-500">{MEMBERSHIP_COPY.calculatorCaveat}</p>
      </div>
    </div>
  );
}
