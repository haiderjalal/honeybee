import { formatPkrMinor } from "@/utils/formatPkr";

import { formatAccountDate, getRedemptionDate, REDEMPTION_STATUS_LABELS } from "../accountCopy";

import { AccountPanel } from "./AccountPanel";
import { DetailItem } from "./DetailItem";

import type { ReactElement } from "react";
import type { StoredRedemption } from "@/services/membership/membership.repository";

interface OrderHistoryProps {
  redemptions: readonly StoredRedemption[];
}

/** Each order that used, or still holds, a member discount. */
export function OrderHistory({ redemptions }: OrderHistoryProps): ReactElement {
  return (
    <AccountPanel id="orders-title" title="Member orders">
      {redemptions.length === 0 ? (
        <p className="text-cream-300">No member orders yet. Discounted orders will appear here once they are placed.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {redemptions.map((redemption) => (
            <OrderItem key={redemption.id} redemption={redemption} />
          ))}
        </ul>
      )}
    </AccountPanel>
  );
}

interface OrderItemProps {
  redemption: StoredRedemption;
}

function OrderItem({ redemption }: OrderItemProps): ReactElement {
  const { label, date } = getRedemptionDate(redemption);
  const discountValue = redemption.status === "released" ? "Not applied" : formatPkrMinor(redemption.discountMinor);

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-cream-50/10 bg-forest-950/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="break-all text-cream-300">
          Order reference <span className="font-medium text-cream-50">{redemption.orderReference}</span>
        </p>
        <span className="rounded-full border border-gold-400/30 px-3 py-1 text-xs font-medium text-gold-300">
          {REDEMPTION_STATUS_LABELS[redemption.status]}
        </span>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="Member discount" value={discountValue} />
        {redemption.reversedDiscountMinor > 0 ? (
          <DetailItem label="Discount reversed" value={formatPkrMinor(redemption.reversedDiscountMinor)} />
        ) : null}
        {redemption.refundedPaidMinor > 0 ? (
          <DetailItem label="Refunded" value={formatPkrMinor(redemption.refundedPaidMinor)} />
        ) : null}
        <DetailItem label={label} value={date ? formatAccountDate(date) : "Not recorded"} />
      </dl>
    </li>
  );
}
