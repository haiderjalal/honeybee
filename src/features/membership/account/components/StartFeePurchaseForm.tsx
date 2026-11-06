"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";

import { ACCOUNT_ACTION_IDLE } from "../accountActionState";
import { startFeePurchaseAction } from "../actions";
import { FEE_TEXT } from "../accountCopy";

import { FormMessage } from "./FormMessage";

import type { ReactElement } from "react";

interface StartFeePurchaseFormProps {
  purpose: "new" | "renewal";
  /** Read on the server. The server action enforces the same gate, so this only controls what is shown. */
  salesOpen: boolean;
}

const SIGN_UPS_NOTE_ID = "sign-ups-note";

/** Collects the mobile number for a new membership or a renewal. */
export function StartFeePurchaseForm({ purpose, salesOpen }: StartFeePurchaseFormProps): ReactElement {
  const [state, formAction, isPending] = useActionState(startFeePurchaseAction, ACCOUNT_ACTION_IDLE);
  const [phone, setPhone] = useState("");
  const actionLabel = purpose === "renewal" ? `Renew for ${FEE_TEXT}` : `Join for ${FEE_TEXT}`;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <InputField
        id="fee-phone"
        name="phone"
        label="Mobile number"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        hint="Pakistani mobile number, for example 0300 1234567."
        required
        disabled={!salesOpen}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />

      {salesOpen ? null : (
        <p id={SIGN_UPS_NOTE_ID} className="text-sm text-cream-300">
          Sign-ups open soon. We will announce the opening date on the site.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={!salesOpen || isPending}
        aria-describedby={salesOpen ? undefined : SIGN_UPS_NOTE_ID}
      >
        {actionLabel}
      </Button>

      {state.status !== "idle" ? <FormMessage tone={state.status} message={state.message} /> : null}
    </form>
  );
}
