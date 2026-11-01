"use client";

import { useCallback, useRef, useState } from "react";

import type { CartItem } from "@/features/cart/store/cartStore";
import type { CustomerInput } from "@/lib/validations/inquiry.schema";
import type { ApiResponse, FieldErrors, InquiryReceipt } from "@/types/api";

export type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface SubmitState {
  status: SubmitStatus;
  reference: string | null;
  message: string | null;
  fieldErrors: FieldErrors;
}

const INITIAL: SubmitState = { status: "idle", reference: null, message: null, fieldErrors: {} };
const REQUEST_TIMEOUT_MS = 20_000;
const CONNECTION_MESSAGE = "We couldn't reach our server. Check your connection and try again.";
const UNREADABLE_MESSAGE = "Something went wrong on our side. Please try again.";

/**
 * Random UUID v4. `crypto.randomUUID` only exists in secure contexts (HTTPS or localhost),
 * so pages opened over plain HTTP on a LAN address fall back to `getRandomValues`, which works everywhere.
 */
export function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Aborts a request after `ms`; falls back to a timer on browsers without `AbortSignal.timeout`. */
function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);

  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** Reads the JSON envelope, or returns null when the server answered with something else (e.g. an error page). */
async function readEnvelope(response: Response): Promise<ApiResponse<InquiryReceipt> | null> {
  try {
    return (await response.json()) as ApiResponse<InquiryReceipt>;
  } catch {
    return null;
  }
}

/** Posts an order request. One idempotency key per attempt series prevents duplicate orders on retry. */
export function useInquirySubmit() {
  const [state, setState] = useState<SubmitState>(INITIAL);
  const idempotencyKey = useRef<string | null>(null);

  const submit = useCallback(
    async (customer: CustomerInput & { website?: string }, items: CartItem[]): Promise<boolean> => {
      idempotencyKey.current ??= createIdempotencyKey();
      setState({ ...INITIAL, status: "submitting" });

      try {
        const response = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...customer,
            items: items.map(({ varietySlug, sizeId, quantity }) => ({ varietySlug, sizeId, quantity })),
            idempotencyKey: idempotencyKey.current,
          }),
          signal: timeoutSignal(REQUEST_TIMEOUT_MS),
        });
        const payload = await readEnvelope(response);

        if (payload?.success) {
          idempotencyKey.current = null;
          setState({ status: "success", reference: payload.data.reference, message: payload.message, fieldErrors: {} });
          return true;
        }
        setState({
          status: "error",
          reference: null,
          message: payload?.message ?? UNREADABLE_MESSAGE,
          fieldErrors: payload?.errors ?? {},
        });
        return false;
      } catch {
        setState({ status: "error", reference: null, message: CONNECTION_MESSAGE, fieldErrors: {} });
        return false;
      }
    },
    [],
  );

  return { ...state, submit };
}
