import { MEMBERSHIP_BANK_TRANSFER } from "@/constants/membership";

import { DetailItem } from "./DetailItem";

import type { ReactElement } from "react";

/** The bank account members pay the fee into. Shows a plain notice until the account is confirmed. */
export function BankTransferDetails(): ReactElement {
  if (!MEMBERSHIP_BANK_TRANSFER) {
    return (
      <p className="text-cream-300">Bank details for the transfer are being confirmed. Please check back shortly.</p>
    );
  }

  const account = MEMBERSHIP_BANK_TRANSFER;
  return (
    <dl className="grid gap-4 rounded-2xl border border-cream-50/10 bg-forest-900/60 p-4 sm:grid-cols-2">
      <DetailItem label="Payment method" value={account.method} />
      <DetailItem label="Account title" value={account.accountTitle} />
      <DetailItem label="Account number" value={account.accountNumber} />
      {account.iban ? <DetailItem label="IBAN" value={account.iban} /> : null}
    </dl>
  );
}
