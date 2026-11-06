import { z } from "zod";

import { ACCOUNT_COPY, REFERENCE_LENGTH } from "./accountCopy";

/** Input rules for the membership account forms. The server re-validates every value before it reaches a service. */

export const feePurchaseSchema = z.object({
  phone: z
    .string({ error: ACCOUNT_COPY.invalidPhone })
    .trim()
    .min(1, { error: ACCOUNT_COPY.invalidPhone })
    .max(20, { error: ACCOUNT_COPY.invalidPhone }),
});

export const paymentReferenceSchema = z.object({
  purchaseId: z.uuid({ error: ACCOUNT_COPY.purchaseNotFound }),
  reference: z
    .string({ error: ACCOUNT_COPY.invalidReference })
    .trim()
    .min(REFERENCE_LENGTH.min, { error: ACCOUNT_COPY.invalidReference })
    .max(REFERENCE_LENGTH.max, { error: ACCOUNT_COPY.invalidReference }),
});

/** The first failed rule's message. Every message comes from ACCOUNT_COPY, so it is safe to show. */
export function getFirstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? ACCOUNT_COPY.invalidInput;
}
