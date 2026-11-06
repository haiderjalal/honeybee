import { cn } from "@/utils/cn";

import type { ReactElement } from "react";

interface FormMessageProps {
  tone: "success" | "error";
  message: string;
}

/** Announces the result of a form. Errors use role="alert"; confirmations use role="status" so they are not intrusive. */
export function FormMessage({ tone, message }: FormMessageProps): ReactElement {
  const isError = tone === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        isError ? "border-danger/60 text-danger" : "border-gold-400/40 text-cream-100",
      )}
    >
      {message}
    </p>
  );
}
