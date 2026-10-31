import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

const CONTROL =
  "w-full min-h-12 rounded-xl border border-cream-500/30 bg-forest-900/70 px-4 py-3 text-base text-cream-50 placeholder:text-cream-500/70 transition-colors focus-visible:border-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 aria-invalid:border-danger";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, optional, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-cream-100">
        {label}
        {optional ? <span className="ml-1 font-normal text-cream-500">(optional)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-cream-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type InputFieldProps = Omit<FieldShellProps, "children"> & InputHTMLAttributes<HTMLInputElement>;

export function InputField({ id, label, hint, error, optional, className, ...props }: InputFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL, className)}
        {...props}
      />
    </FieldShell>
  );
}

type TextareaFieldProps = Omit<FieldShellProps, "children"> & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextareaField({ id, label, hint, error, optional, className, ...props }: TextareaFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL, "min-h-24 resize-y", className)}
        {...props}
      />
    </FieldShell>
  );
}
