import { NextResponse } from "next/server";
import { z } from "zod";

import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE, SIZE_IDS } from "@/constants/catalog";
import { logger } from "@/lib/logger";
import { getMembershipRepository } from "@/lib/supabase/membershipRepository";
import { getSignedInUser } from "@/lib/supabase/session";
import { getListPrice, getPricedVariant } from "@/services/catalog.service";
import {
  quoteMemberDiscount,
  type MemberQuote,
  type OrderDiscountLine,
} from "@/services/membership/membership.service";
import { rupeesToMinor } from "@/utils/money";

import type { ApiResponse } from "@/types/api";

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        varietySlug: z.string().trim().min(1).max(60),
        sizeId: z.enum(SIZE_IDS),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      }),
    )
    .min(1)
    .max(MAX_CART_LINES),
});

const NO_STORE = { "Cache-Control": "no-store" };

/** Prices the basket from the catalogue, merging repeated jars. Returns null for any unknown product. */
function priceBasket(items: z.infer<typeof quoteSchema>["items"]): OrderDiscountLine[] | null {
  const merged = new Map<string, OrderDiscountLine>();
  for (const item of items) {
    const variant = getPricedVariant(item.varietySlug, item.sizeId);
    if (!variant) return null;

    const lineKey = `${item.varietySlug}:${item.sizeId}`;
    const quantity = (merged.get(lineKey)?.quantity ?? 0) + item.quantity;
    merged.set(lineKey, {
      lineKey,
      quantity,
      lineTotalMinor: rupeesToMinor(variant.unitPrice) * quantity,
      onSale: getListPrice(variant.variety, variant.size.id) !== null,
    });
  }
  return [...merged.values()];
}

/**
 * POST /api/membership/quote — the member discount for a basket, for display only. It never reserves an allowance,
 * and a signed-out visitor simply gets { signedIn: false }.
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<MemberQuote>>> {
  const repo = getMembershipRepository();
  const user = repo ? await getSignedInUser().catch(() => null) : null;
  if (!repo || !user) {
    return NextResponse.json({ success: true, message: "", data: { signedIn: false } }, { headers: NO_STORE });
  }

  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Check your hive and try again." },
      { status: 422, headers: NO_STORE },
    );
  }

  const lines = priceBasket(parsed.data.items);
  if (!lines) {
    return NextResponse.json(
      { success: false, message: "Some jars in your hive are no longer available." },
      { status: 422, headers: NO_STORE },
    );
  }

  try {
    const quote = await quoteMemberDiscount(repo, { customerUserId: user.id, lines, now: new Date() });
    return NextResponse.json({ success: true, message: "", data: quote }, { headers: NO_STORE });
  } catch (error) {
    logger.error("Member discount quote failed", { error });
    return NextResponse.json(
      { success: false, message: "We couldn't check your member discount just now." },
      { status: 500, headers: NO_STORE },
    );
  }
}
