"use client";

import { useActionState } from "react";
import type { JSX } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { verifyPaymentAction } from "@/features/membership/admin/actions";
import { ADMIN_ACTION_IDLE } from "@/features/membership/admin/adminActionState";
import { MAX_REASON_LENGTH, PAYMENT_REFERENCE_LENGTH } from "@/features/membership/admin/adminConstants";
import { ADMIN_FIELDS } from "@/features/membership/admin/adminFormFields";

import { ActionMessage } from "./ActionMessage";

export interface PendingPaymentRow {
  id: string;
  phone: string;
  purposeLabel: string;
  amountLabel: string;
  /** What the customer typed for their transfer. This is a claim, not proof. */
  customerReference: string;
  createdLabel: string;
}

interface PendingPaymentsPanelProps {
  rows: PendingPaymentRow[];
}

/** Verification forms for pending membership payments. One shared action state reports the result above the list. */
export function PendingPaymentsPanel({ rows }: PendingPaymentsPanelProps): JSX.Element {
  const [state, formAction, isPending] = useActionState(verifyPaymentAction, ADMIN_ACTION_IDLE);

  return (
    <div className="flex flex-col gap-6">
      <ActionMessage state={state} />

      {rows.length === 0 ? (
        <p className="text-cream-300">No membership payments are waiting for verification.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-cream-50/10 bg-forest-950/40 p-5 sm:p-6">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PaymentFact label="Phone" value={row.phone} />
                <PaymentFact label="Purpose" value={row.purposeLabel} />
                <PaymentFact label="Amount" value={row.amountLabel} />
                <PaymentFact label="Created" value={row.createdLabel} />
                <div className="min-w-0 sm:col-span-2 lg:col-span-4">
                  <dt className="text-xs tracking-wide text-cream-500 uppercase">
                    Customer’s stated reference (a claim, not proof)
                  </dt>
                  <dd className="mt-1 break-words text-cream-50">{row.customerReference || "None given"}</dd>
                </div>
              </dl>

              <form action={formAction} className="mt-6 grid gap-5 border-t border-cream-50/10 pt-6 sm:grid-cols-2">
                <input type="hidden" name={ADMIN_FIELDS.purchaseId} value={row.id} />
                <InputField
                  id={`${row.id}-reference`}
                  name={ADMIN_FIELDS.providerReference}
                  label="Bank or transfer reference"
                  hint="Copy it from your bank statement, not from the customer’s message."
                  required
                  minLength={PAYMENT_REFERENCE_LENGTH.min}
                  maxLength={PAYMENT_REFERENCE_LENGTH.max}
                  autoComplete="off"
                />
                <InputField
                  id={`${row.id}-reason`}
                  name={ADMIN_FIELDS.reason}
                  label="Note"
                  optional
                  maxLength={MAX_REASON_LENGTH}
                  autoComplete="off"
                />
                <label className="flex items-start gap-3 text-sm text-cream-100 sm:col-span-2">
                  <input
                    type="checkbox"
                    name={ADMIN_FIELDS.confirmed}
                    value="yes"
                    required
                    className="mt-1 size-4 shrink-0 accent-gold-400"
                  />
                  <span>I have matched this transfer on my bank statement.</span>
                </label>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    Verify payment
                  </Button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PaymentFact({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="text-xs tracking-wide text-cream-500 uppercase">{label}</dt>
      <dd className="mt-1 break-words text-cream-50 tabular-nums">{value}</dd>
    </div>
  );
}
