"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { InputField, TextareaField } from "@/components/ui/Field";
import { customerSchema, type CustomerInput } from "@/lib/validations/inquiry.schema";
import { formatPkr } from "@/utils/formatPkr";

import type { FieldErrors } from "@/types/api";

interface InquiryFormProps {
  subtotal: number;
  submitting: boolean;
  serverMessage: string | null;
  serverErrors: FieldErrors;
  onSubmit: (values: CustomerInput & { website?: string }) => void;
}

const FIELDS = ["name", "phone", "email", "city", "address", "notes"] as const;

export function InquiryForm({ subtotal, submitting, serverMessage, serverErrors, onSubmit }: InquiryFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    mode: "onTouched",
    defaultValues: { name: "", phone: "", email: "", city: "", address: "", notes: "" },
  });

  // Surface server-side validation messages on the matching fields.
  useEffect(() => {
    for (const field of FIELDS) {
      const message = serverErrors[field];
      if (message) setError(field, { type: "server", message }, { shouldFocus: true });
    }
  }, [serverErrors, setError]);

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values, event) => {
        const form = event?.target;
        const website = form instanceof HTMLFormElement ? String(new FormData(form).get("website") ?? "") : "";
        onSubmit({ ...values, website });
      })}
      className="space-y-5"
      aria-describedby={serverMessage ? "form-message" : undefined}
    >
      <InputField
        id="name"
        label="Full name"
        autoComplete="name"
        maxLength={80}
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="phone"
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0300 1234567"
          hint="We'll call or WhatsApp this number to confirm."
          error={errors.phone?.message}
          {...register("phone")}
        />
        <InputField
          id="email"
          label="Email"
          optional
          type="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          hint="For your order confirmation."
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <InputField
        id="city"
        label="City"
        autoComplete="address-level2"
        maxLength={60}
        error={errors.city?.message}
        {...register("city")}
      />
      <TextareaField
        id="address"
        label="Delivery address"
        autoComplete="street-address"
        maxLength={300}
        rows={3}
        error={errors.address?.message}
        {...register("address")}
      />
      <TextareaField
        id="notes"
        label="Notes"
        optional
        maxLength={500}
        rows={3}
        placeholder="Preferred delivery time, gift message…"
        error={errors.notes?.message}
        {...register("notes")}
      />

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="visually-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {serverMessage ? (
        <p
          id="form-message"
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {serverMessage}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitting} aria-busy={submitting}>
        {submitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Sending your request…
          </>
        ) : (
          <>Send order request · {formatPkr(subtotal)}</>
        )}
      </Button>
      <p className="text-center text-xs text-cream-500">
        No payment is taken online. We confirm delivery and payment with you by phone.
      </p>
    </form>
  );
}
