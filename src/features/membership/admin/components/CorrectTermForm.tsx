"use client";

import { useActionState } from "react";
import type { JSX } from "react";

import { Button } from "@/components/ui/Button";
import { InputField, SelectField, TextareaField } from "@/components/ui/Field";
import { correctMemberTermAction } from "@/features/membership/admin/actions";
import { ADMIN_ACTION_IDLE } from "@/features/membership/admin/adminActionState";
import { MAX_REASON_LENGTH } from "@/features/membership/admin/adminConstants";
import { ADMIN_FIELDS } from "@/features/membership/admin/adminFormFields";

import { ActionMessage } from "./ActionMessage";

interface CorrectTermFormProps {
  termId: string;
  allowance: number;
  currentExpiry: string;
  currentDiscountsUsed: number;
}

/** Corrects a membership term. Blank fields mean "no change", and the reason is always recorded. */
export function CorrectTermForm({
  termId,
  allowance,
  currentExpiry,
  currentDiscountsUsed,
}: CorrectTermFormProps): JSX.Element {
  const [state, formAction, isPending] = useActionState(correctMemberTermAction, ADMIN_ACTION_IDLE);

  return (
    <div className="flex flex-col gap-4">
      <ActionMessage state={state} />

      <form action={formAction} className="grid gap-5 sm:grid-cols-2">
        <input type="hidden" name={ADMIN_FIELDS.termId} value={termId} />

        <SelectField
          id="correct-status"
          name={ADMIN_FIELDS.status}
          label="Status"
          hint="Leave as No change to keep the current status."
        >
          <option value="">No change</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </SelectField>

        <InputField
          id="correct-expiry"
          name={ADMIN_FIELDS.expiresAt}
          type="datetime-local"
          label="New expiry date and time"
          hint={`Membership time (UTC+5). Currently ${currentExpiry}.`}
          optional
        />

        <InputField
          id="correct-discounts"
          name={ADMIN_FIELDS.discountsUsed}
          type="number"
          inputMode="numeric"
          min={0}
          max={allowance}
          step={1}
          label="Discounts used"
          hint={`Whole number from 0 to ${allowance}. Currently ${currentDiscountsUsed}.`}
          optional
        />

        <TextareaField
          id="correct-reason"
          name={ADMIN_FIELDS.reason}
          label="Reason for this change"
          hint="Required. Recorded in the audit log."
          required
          maxLength={MAX_REASON_LENGTH}
          className="sm:col-span-2"
        />

        <div className="sm:col-span-2">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            Save correction
          </Button>
        </div>
      </form>
    </div>
  );
}
