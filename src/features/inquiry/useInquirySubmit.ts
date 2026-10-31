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

/** Posts an order request. One idempotency key per attempt series prevents duplicate orders on retry. */
export function useInquirySubmit() {
  const [state, setState] = useState<SubmitState>(INITIAL);
  const idempotencyKey = useRef<string | null>(null);

  const submit = useCallback(
    async (customer: CustomerInput & { website?: string }, items: CartItem[]): Promise<boolean> => {
      idempotencyKey.current ??= crypto.randomUUID();
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
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        const payload = (await response.json()) as ApiResponse<InquiryReceipt>;

        if (payload.success) {
          idempotencyKey.current = null;
          setState({ status: "success", reference: payload.data.reference, message: payload.message, fieldErrors: {} });
          return true;
        }
        setState({ status: "error", reference: null, message: payload.message, fieldErrors: payload.errors ?? {} });
        return false;
      } catch {
        setState({
          status: "error",
          reference: null,
          message: "We couldn't reach our server. Check your connection and try again.",
          fieldErrors: {},
        });
        return false;
      }
    },
    [],
  );

  return { ...state, submit };
}
