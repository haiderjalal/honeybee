"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { InputField, SelectField } from "@/components/ui/Field";
import { CUSTOMER_ORDER_STATUSES, type CustomerOrderStatus } from "@/services/customerOrder.repository";

import { setOrderStatusAction } from "./actions";
import { ORDER_ACTION_IDLE } from "./orderActionState";
import { ORDER_STATUS_LABELS } from "./orderDisplay";

import type { ReactElement } from "react";

interface OrderStatusFormProps {
  reference: string;
  currentStatus: CustomerOrderStatus;
}

/** Changes the status. A short note is required, because every change is recorded in the audit log. */
export function OrderStatusForm({ reference, currentStatus }: OrderStatusFormProps): ReactElement {
  const [state, formAction, isPending] = useActionState(setOrderStatusAction, ORDER_ACTION_IDLE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="reference" value={reference} />
      <SelectField id="order-new-status" name="status" label="New status" defaultValue={currentStatus}>
        {CUSTOMER_ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <InputField
        id="order-status-reason"
        name="reason"
        label="Note for the audit log"
        hint="For example: Confirmed by phone, or Delivered."
        required
        minLength={3}
        maxLength={200}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save status"}
        </Button>
        <p role="status" className={state.status === "error" ? "text-sm text-danger" : "text-sm text-cream-300"}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
