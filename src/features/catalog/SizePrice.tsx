import { getListPrice } from "@/services/catalog.service";
import { cn } from "@/utils/cn";
import { formatPkr } from "@/utils/formatPkr";

import type { HoneyVariety, SizeId } from "@/types/catalog";

interface SizePriceProps {
  variety: HoneyVariety;
  sizeId: SizeId;
  className?: string;
}

/** The sale price, with the original price struck through when the jar is on offer. */
export function SizePrice({ variety, sizeId, className }: SizePriceProps) {
  const listPrice = getListPrice(variety, sizeId);

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      {listPrice ? (
        <s className="text-sm text-cream-500">
          <span className="sr-only">Was </span>
          {formatPkr(listPrice)}
        </s>
      ) : null}
      <span>{formatPkr(variety.prices[sizeId])}</span>
    </span>
  );
}
