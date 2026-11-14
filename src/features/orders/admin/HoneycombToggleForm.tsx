"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";

import { setHoneycombAction } from "./honeycombActions";
import { ORDER_ACTION_IDLE } from "./orderActionState";

import type { ReactElement } from "react";

interface HoneycombToggleFormProps {
  reference: string;
  shown: boolean;
}

/** The admin's switch for showing a customer on the public honeycomb. It is off until the customer agrees. */
export function HoneycombToggleForm({ reference, shown }: HoneycombToggleFormProps): ReactElement {
  const [state, formAction, isPending] = useActionState(setHoneycombAction, ORDER_ACTION_IDLE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="reference" value={reference} />
      <label className="flex items-start gap-3 text-cream-100">
        <input type="checkbox" name="show" defaultChecked={shown} className="mt-1 size-5 accent-gold-400" />
        <span>
          Show this customer on the public honeycomb
          <span className="mt-1 block text-sm text-cream-500">
            Their first name and last initial appear on the homepage. Turn this on only after the customer agrees.
          </span>
        </span>
      </label>
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
