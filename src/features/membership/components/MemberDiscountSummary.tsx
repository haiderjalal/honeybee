"use client";

import { useEffect, useState } from "react";

import { MEMBERSHIP } from "@/constants/membership";
import { getBelowMinimumCopy, MEMBERSHIP_OUTCOME_COPY } from "@/constants/membershipContent";
import { formatPkrMinor } from "@/utils/formatPkr";
import { rupeesToMinor } from "@/utils/money";

import type { CartItem } from "@/features/cart/store/cartStore";
import type { MemberQuote } from "@/services/membership/membership.service";

interface MemberDiscountSummaryProps {
  items: CartItem[];
  /** Subtotal in whole rupees, as shown in the order summary. */
  subtotal: number;
}

const discountPercentText = `${MEMBERSHIP.discountRateBps / 100}%`;

/**
 * Shows the member discount inside the checkout summary when a signed-in customer is ordering. The server quote is
 * advisory: the order recalculates and reserves the discount when it is submitted. Signed-out visitors see nothing.
 */
export function MemberDiscountSummary({ items, subtotal }: MemberDiscountSummaryProps) {
  const [quote, setQuote] = useState<MemberQuote | null>(null);
  const basketKey = JSON.stringify(items);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/membership/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: JSON.parse(basketKey) as CartItem[] }),
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<{ success: boolean; data?: MemberQuote }>)
      .then((body) => {
        if (body.success && body.data) setQuote(body.data);
        else setQuote(null);
      })
      .catch(() => {
        // Aborted or offline: the summary simply shows nothing extra. The order itself is still priced server-side.
        setQuote(null);
      });
    return () => controller.abort();
  }, [basketKey]);

  if (!quote || !quote.signedIn) return null;

  if (quote.applied) {
    const subtotalMinor = rupeesToMinor(subtotal);
    const totalMinor = subtotalMinor - quote.discountMinor;
    return (
      <div
        className="mt-4 flex flex-col gap-2 rounded-2xl border border-gold-400/25 bg-forest-900/60 p-4"
        data-testid="member-discount"
      >
        <div className="flex items-baseline justify-between text-cream-100">
          <span>Member discount ({discountPercentText})</span>
          <span className="tabular-nums">− {formatPkrMinor(quote.discountMinor)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-cream-50/10 pt-2">
          <span className="text-cream-300">Total to confirm</span>
          <span className="font-display text-2xl text-gold-300 tabular-nums">{formatPkrMinor(totalMinor)}</span>
        </div>
        <p className="text-xs text-cream-500">
          Applied to regular-price honey only. Delivery is not discounted, and we confirm the final total when we call.
        </p>
      </div>
    );
  }

  const message =
    quote.ineligibleReason === "below_minimum"
      ? getBelowMinimumCopy(quote.shortfallMinor)
      : quote.ineligibleReason
        ? MEMBERSHIP_OUTCOME_COPY[quote.ineligibleReason]
        : null;
  if (!message) return null;

  return (
    <p className="mt-4 rounded-2xl border border-cream-50/10 bg-forest-900/40 p-4 text-sm text-cream-300" role="status">
      {message}
    </p>
  );
}
