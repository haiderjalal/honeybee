import { describe, expect, it } from "vitest";

import { ConsoleNotifier, createInquiryNotifier, ResendNotifier } from "@/lib/email/notifiers";

import type { OrderRequest } from "@/services/inquiry.types";

const order = { reference: "HB-1" } as OrderRequest;
const resendVars = {
  RESEND_API_KEY: "re_test",
  INQUIRY_FROM_EMAIL: "Orders <o@example.com>",
  INQUIRY_TO_EMAIL: "team@example.com",
};

describe("createInquiryNotifier", () => {
  it("uses Resend when it is configured", () => {
    expect(createInquiryNotifier({ NODE_ENV: "production", ...resendVars })).toBeInstanceOf(ResendNotifier);
  });

  it("uses the console transport in development without Resend", () => {
    expect(createInquiryNotifier({ NODE_ENV: "development" })).toBeInstanceOf(ConsoleNotifier);
  });

  it("honours an explicit console transport", () => {
    expect(createInquiryNotifier({ NODE_ENV: "production", EMAIL_TRANSPORT: "console", ...resendVars })).toBeInstanceOf(
      ConsoleNotifier,
    );
  });

  it("fails loudly in production when email is not configured", async () => {
    const notifier = createInquiryNotifier({ NODE_ENV: "production" });
    await expect(notifier.notifyOwner(order)).rejects.toThrow(/not configured/);
  });
});
