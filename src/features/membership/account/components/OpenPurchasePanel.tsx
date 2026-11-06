import { formatPkrMinor } from "@/utils/formatPkr";

import { formatAccountDate } from "../accountCopy";

import { AccountPanel } from "./AccountPanel";
import { DetailItem } from "./DetailItem";
import { PaymentReferenceForm } from "./PaymentReferenceForm";

import type { ReactElement } from "react";
import type { AccountPurchaseSummary } from "@/services/membership/membership.repository";

interface OpenPurchasePanelProps {
  purchase: AccountPurchaseSummary;
}

/**
 * The payment in progress. Neither state implies activation: a term starts only after the payment is verified.
 */
export function OpenPurchasePanel({ purchase }: OpenPurchasePanelProps): ReactElement | null {
  const details = (
    <dl className="grid gap-4 sm:grid-cols-3">
      <DetailItem label="Type" value={purchase.purpose === "renewal" ? "Renewal" : "New membership"} />
      <DetailItem label="Amount" value={formatPkrMinor(purchase.amountMinor)} />
      <DetailItem label="Started on" value={formatAccountDate(purchase.createdAt)} />
    </dl>
  );

  if (purchase.status === "awaiting_payment") {
    return (
      <AccountPanel id="payment-title" title="Complete your payment">
        {details}
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-cream-100">
          <li>Pay the membership fee by bank transfer.</li>
          <li>Enter the transfer reference below.</li>
        </ol>
        <p className="text-sm text-cream-500">Your membership starts only after we have verified the payment.</p>
        <PaymentReferenceForm purchaseId={purchase.id} />
      </AccountPanel>
    );
  }

  if (purchase.status === "pending_verification") {
    return (
      <AccountPanel id="payment-title" title="Payment being checked">
        {details}
        <p className="text-cream-300">We&apos;re checking your payment. Your membership starts once it is verified.</p>
      </AccountPanel>
    );
  }

  return null;
}
