"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";

import { ACCOUNT_ACTION_IDLE } from "../accountActionState";
import { REFERENCE_LENGTH } from "../accountCopy";
import { submitPaymentReferenceAction } from "../actions";

import { FormMessage } from "./FormMessage";

import type { ReactElement } from "react";

interface PaymentReferenceFormProps {
  purchaseId: string;
}

/**
 * Records the transfer reference so the payment can be checked. Submitting only queues the payment for review;
 * the membership starts after verification, never from this form.
 */
export function PaymentReferenceForm({ purchaseId }: PaymentReferenceFormProps): ReactElement {
  const [state, formAction, isPending] = useActionState(submitPaymentReferenceAction, ACCOUNT_ACTION_IDLE);
  const [reference, setReference] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="purchaseId" defaultValue={purchaseId} />

      <InputField
        id="payment-reference"
        name="reference"
        label="Transfer reference"
        hint={`The reference from your bank transfer, ${REFERENCE_LENGTH.min} to ${REFERENCE_LENGTH.max} characters.`}
        required
        minLength={REFERENCE_LENGTH.min}
        maxLength={REFERENCE_LENGTH.max}
        autoComplete="off"
        value={reference}
        onChange={(event) => setReference(event.target.value)}
      />

      <Button type="submit" variant="secondary" disabled={isPending} className="self-start">
        {isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        Submit transfer reference
      </Button>

      {state.status !== "idle" ? <FormMessage tone={state.status} message={state.message} /> : null}
    </form>
  );
}
