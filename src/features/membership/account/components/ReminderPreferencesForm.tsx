"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { MEMBERSHIP } from "@/constants/membership";

import { ACCOUNT_ACTION_IDLE } from "../accountActionState";
import { saveReminderPreferencesAction } from "../actions";

import { AccountPanel } from "./AccountPanel";
import { FormMessage } from "./FormMessage";

import type { ReactElement } from "react";
import type { ReminderPreferences } from "@/services/membership/membership.repository";

interface ReminderPreferencesFormProps {
  preferences: ReminderPreferences;
}

const [longLeadDays, shortLeadDays] = MEMBERSHIP.renewalReminderDays;

/**
 * Consent for the two optional reminders. Reminders are not sent yet, so the copy says so; saving a choice only
 * records it. Unticking a box and saving withdraws consent for that reminder.
 */
export function ReminderPreferencesForm({ preferences }: ReminderPreferencesFormProps): ReactElement {
  const [state, formAction, isPending] = useActionState(saveReminderPreferencesAction, ACCOUNT_ACTION_IDLE);

  // Remounting when the saved values change keeps the boxes in step with what is stored, even after React resets the form.
  const savedKey = `${preferences.renewalReminders}-${preferences.reorderReminders}`;

  return (
    <AccountPanel id="reminders-title" title="Reminders">
      <p className="text-cream-300">Reminders are optional. You can turn either one on or off at any time.</p>

      <form key={savedKey} action={formAction} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">Reminder choices</legend>
          <ReminderCheckbox
            name="renewalReminders"
            label={`Renewal reminders ${longLeadDays} and ${shortLeadDays} days before expiry`}
            hint="We'll remind you when your term is ending. Reminders are not being sent yet."
            defaultChecked={preferences.renewalReminders}
          />
          <ReminderCheckbox
            name="reorderReminders"
            label="Reorder reminders (optional, off by default)"
            hint="Reminders are not being sent yet. Your choice is saved for when they start."
            defaultChecked={preferences.reorderReminders}
          />
        </fieldset>

        <Button type="submit" variant="secondary" disabled={isPending} className="self-start">
          Save reminder choices
        </Button>

        {state.status !== "idle" ? <FormMessage tone={state.status} message={state.message} /> : null}
      </form>
    </AccountPanel>
  );
}

interface ReminderCheckboxProps {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}

function ReminderCheckbox({ name, label, hint, defaultChecked }: ReminderCheckboxProps): ReactElement {
  const hintId = `${name}-hint`;

  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl border border-cream-50/10 bg-forest-950/40 p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        aria-describedby={hintId}
        className="mt-1 size-5 shrink-0 accent-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
      />
      <span className="flex flex-col gap-1">
        <span className="font-medium text-cream-50">{label}</span>
        <span id={hintId} className="text-sm text-cream-300">
          {hint}
        </span>
      </span>
    </label>
  );
}
