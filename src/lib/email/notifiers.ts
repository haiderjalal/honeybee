import "server-only";

import { Resend } from "resend";

import { logger } from "@/lib/logger";

import { customerConfirmationEmail, ownerInquiryEmail, type EmailContent } from "./templates";

import type { ServerEnv } from "@/lib/env";
import type { InquiryNotifier, OrderRequest } from "@/services/inquiry.types";

const SEND_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Email provider timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Validation-type errors from Resend will not succeed on retry. */
const PERMANENT_ERRORS = new Set([
  "validation_error",
  "missing_required_field",
  "invalid_from_address",
  "invalid_api_key",
  "restricted_api_key",
]);

export class ResendNotifier implements InquiryNotifier {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
    private readonly ownerEmail: string,
  ) {
    this.client = new Resend(apiKey);
  }

  notifyOwner(order: OrderRequest): Promise<void> {
    return this.send(
      `${order.reference}-owner`,
      this.ownerEmail,
      ownerInquiryEmail(order),
      order.customer.email ?? undefined,
    );
  }

  notifyCustomer(order: OrderRequest): Promise<void> {
    if (!order.customer.email) return Promise.resolve();
    return this.send(
      `${order.reference}-customer`,
      order.customer.email,
      customerConfirmationEmail(order),
      this.ownerEmail,
    );
  }

  private async send(idempotencyKey: string, to: string, content: EmailContent, replyTo?: string): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { error } = await withTimeout(
          this.client.emails.send({ from: this.from, to, replyTo, ...content }, { idempotencyKey }),
          SEND_TIMEOUT_MS,
        );
        if (!error) return;
        lastError = new Error(`Resend error: ${error.name} — ${error.message}`);
        if (PERMANENT_ERRORS.has(error.name)) break;
      } catch (error) {
        lastError = error;
      }
      if (attempt < MAX_ATTEMPTS) await wait(300 * 2 ** (attempt - 1));
    }
    throw lastError instanceof Error ? lastError : new Error("Email delivery failed");
  }
}

/** Development / e2e transport: logs the order instead of sending email. */
export class ConsoleNotifier implements InquiryNotifier {
  async notifyOwner(order: OrderRequest): Promise<void> {
    logger.info("[console email] owner notification", {
      reference: order.reference,
      subject: ownerInquiryEmail(order).subject.split(" — ")[0],
    });
  }

  async notifyCustomer(order: OrderRequest): Promise<void> {
    logger.info("[console email] customer confirmation", { reference: order.reference });
  }
}

/** Used in production when email is not configured, so orders fail visibly instead of being silently lost. */
class UnconfiguredNotifier implements InquiryNotifier {
  async notifyOwner(): Promise<void> {
    throw new Error("Email is not configured: set RESEND_API_KEY, INQUIRY_FROM_EMAIL and INQUIRY_TO_EMAIL");
  }

  async notifyCustomer(): Promise<void> {}
}

export function createInquiryNotifier(env: ServerEnv): InquiryNotifier {
  // getServerEnv() guarantees the Resend variables are present whenever the transport resolves to "resend".
  if (env.RESEND_API_KEY && env.INQUIRY_FROM_EMAIL && env.INQUIRY_TO_EMAIL && env.EMAIL_TRANSPORT !== "console") {
    return new ResendNotifier(env.RESEND_API_KEY, env.INQUIRY_FROM_EMAIL, env.INQUIRY_TO_EMAIL);
  }
  if (env.NODE_ENV === "production" && env.EMAIL_TRANSPORT !== "console") {
    logger.error("Order emails are not configured — order requests will fail until Resend is set up", {});
    return new UnconfiguredNotifier();
  }
  return new ConsoleNotifier();
}
