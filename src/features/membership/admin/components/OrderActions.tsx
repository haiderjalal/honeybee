"use client";

import { useActionState } from "react";
import type { JSX } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { fulfilOrderAction, refundOrderAction, releaseOrderAction } from "@/features/membership/admin/actions";
import { ADMIN_ACTION_IDLE } from "@/features/membership/admin/adminActionState";
import { ADMIN_FIELDS, refundFieldName } from "@/features/membership/admin/adminFormFields";
import type { RedemptionStatus } from "@/types/membership";

import { ActionMessage } from "./ActionMessage";

export interface OrderActionLine {
  lineKey: string;
  refundableQuantity: number;
}

interface OrderActionsProps {
  orderReference: string;
  status: RedemptionStatus;
  lines: OrderActionLine[];
}

/**
 * Fulfil, release and refund for one order. Each action keeps its own result, and the results stay visible after the
 * order changes status, so a completed refund still shows what it did.
 */
export function OrderActions({ orderReference, status, lines }: OrderActionsProps): JSX.Element {
  const [fulfilState, fulfilAction, fulfilPending] = useActionState(fulfilOrderAction, ADMIN_ACTION_IDLE);
  const [releaseState, releaseAction, releasePending] = useActionState(releaseOrderAction, ADMIN_ACTION_IDLE);
  const [refundState, refundAction, refundPending] = useActionState(refundOrderAction, ADMIN_ACTION_IDLE);

  const isReserved = status === "reserved";
  const canRefund = status === "consumed" && lines.some((line) => line.refundableQuantity > 0);

  return (
    <div className="flex flex-col gap-6">
      <ActionMessage state={fulfilState} />
      <ActionMessage state={releaseState} />
      <ActionMessage state={refundState} />

      {isReserved ? (
        <form
          action={fulfilAction}
          className="flex flex-col gap-3 rounded-2xl border border-cream-50/10 bg-forest-950/40 p-5"
        >
          <input type="hidden" name={ADMIN_FIELDS.orderReference} value={orderReference} />
          <div>
            <h4 className="font-medium text-cream-50">Mark fulfilled</h4>
            <p className="text-sm text-cream-300">Counts this order’s discount as used.</p>
          </div>
          <Button type="submit" disabled={fulfilPending} className="w-full sm:w-auto">
            Mark fulfilled
          </Button>
        </form>
      ) : null}

      {isReserved ? (
        <form
          action={releaseAction}
          className="flex flex-col gap-3 rounded-2xl border border-cream-50/10 bg-forest-950/40 p-5"
        >
          <input type="hidden" name={ADMIN_FIELDS.orderReference} value={orderReference} />
          <div>
            <h4 className="font-medium text-cream-50">Release reservation</h4>
            <p className="text-sm text-cream-300">
              Frees the reserved discount. Use it when payment fails, the unpaid order expires, the order is cancelled,
              or a cash-on-delivery order is rejected or fails delivery.
            </p>
          </div>
          <Button type="submit" variant="secondary" disabled={releasePending} className="w-full sm:w-auto">
            Release reservation
          </Button>
        </form>
      ) : null}

      {canRefund ? (
        <form
          action={refundAction}
          className="flex flex-col gap-5 rounded-2xl border border-cream-50/10 bg-forest-950/40 p-5"
        >
          <input type="hidden" name={ADMIN_FIELDS.orderReference} value={orderReference} />
          <div>
            <h4 className="font-medium text-cream-50">Refund</h4>
            <p className="text-sm text-cream-300">
              A partial refund returns the amount paid for those jars. A full refund (every jar) restores the discount
              allowance to the original term only. The term’s dates do not change, and the term is not extended.
            </p>
          </div>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-medium text-cream-100">Quantities to refund</legend>
            {lines.map((line, index) => (
              <InputField
                key={line.lineKey}
                id={`refund-line-${index}`}
                name={refundFieldName(line.lineKey)}
                type="number"
                inputMode="numeric"
                min={0}
                max={line.refundableQuantity}
                step={1}
                defaultValue={0}
                label={`Quantity to refund for ${line.lineKey}`}
                hint={
                  line.refundableQuantity > 0
                    ? `Up to ${line.refundableQuantity} not yet refunded`
                    : "Already fully refunded"
                }
                disabled={line.refundableQuantity === 0}
              />
            ))}
          </fieldset>

          <label className="flex items-start gap-3 text-sm text-cream-100">
            <input
              type="checkbox"
              name={ADMIN_FIELDS.confirmed}
              value="yes"
              required
              className="mt-1 size-4 shrink-0 accent-gold-400"
            />
            <span>I understand that this refund cannot be reversed.</span>
          </label>

          <Button type="submit" variant="secondary" disabled={refundPending} className="w-full sm:w-auto">
            Refund selected quantities
          </Button>
        </form>
      ) : null}

      {!isReserved && !canRefund ? (
        <p className="text-sm text-cream-300">No further actions are available for this order.</p>
      ) : null}
    </div>
  );
}
