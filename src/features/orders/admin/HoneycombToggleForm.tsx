"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { HONEYCOMB_NAME_MAX_LENGTH } from "@/features/honeycomb/honeycombLayout";

import { setHoneycombAction } from "./honeycombActions";
import { ORDER_ACTION_IDLE } from "./orderActionState";

import type { ReactElement } from "react";

interface HoneycombToggleFormProps {
  reference: string;
  shown: boolean;
  /** The name currently chosen for the cell. Blank means the name is generated from the customer's name. */
  displayName: string | null;
}

/** The admin's switch and name for a customer's honeycomb cell. Off until the customer agrees to be shown. */
export function HoneycombToggleForm({ reference, shown, displayName }: HoneycombToggleFormProps): ReactElement {
  const [state, formAction, isPending] = useActionState(setHoneycombAction, ORDER_ACTION_IDLE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="reference" value={reference} />
      <label className="flex items-start gap-3 text-cream-100">
        <input type="checkbox" name="show" defaultChecked={shown} className="mt-1 size-5 accent-gold-400" />
        <span>
          Show this customer on the public honeycomb
          <span className="mt-1 block text-sm text-cream-500">
            Their name appears on the homepage. Turn this on only after the customer agrees.
          </span>
        </span>
      </label>
      <InputField
        id="honeycomb-display-name"
        name="display_name"
        label="Name on the cell"
        hint={`Leave blank to show the first name and last initial. Up to ${HONEYCOMB_NAME_MAX_LENGTH} characters, such as Faizan A.`}
        defaultValue={displayName ?? ""}
        maxLength={HONEYCOMB_NAME_MAX_LENGTH}
        autoComplete="off"
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Saving…" : "Save honeycomb choice"}
        </Button>
        <p role="status" className={state.status === "error" ? "text-sm text-danger" : "text-sm text-cream-300"}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
