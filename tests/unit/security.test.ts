import { describe, expect, it } from "vitest";

import { escapeHtml, ownerInquiryEmail } from "@/lib/email/templates";
import { createRateLimiter } from "@/lib/rateLimit";
import { sanitizeLine, sanitizeMultiline } from "@/utils/text";

import type { OrderRequest } from "@/services/inquiry.types";

describe("escapeHtml", () => {
  it("neutralises markup", () => {
    expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;",
    );
  });
});

describe("ownerInquiryEmail", () => {
  it("never puts raw customer HTML into the email", () => {
    const order: OrderRequest = {
      reference: "HB-1",
      createdAt: "2026-10-31T10:00:00.000Z",
      customer: {
        name: "<img src=x onerror=alert(1)>",
        phone: "03001234567",
        email: null,
        city: "Lahore",
        address: "<b>x</b>",
        notes: null,
      },
      lines: [
        {
          varietySlug: "sidr-honey",
          sizeId: "1kg",
          name: "Sidr Honey",
          sizeLabel: "1 kg",
          quantity: 1,
          unitPrice: 6000,
          lineTotal: 6000,
        },
      ],
      subtotal: 6000,
    };
    const email = ownerInquiryEmail(order);
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(email.html).toContain("Rs 6,000");
  });
});

describe("text sanitisers", () => {
  it("strips control characters and line breaks from single-line fields", () => {
    expect(sanitizeLine("  Ali\r\nBcc: evil@example.com\u0007 ")).toBe("Ali Bcc: evil@example.com");
  });

  it("keeps meaningful line breaks in multi-line fields", () => {
    expect(sanitizeMultiline("Line 1\r\n\r\n\r\n\r\nLine 2\u0000")).toBe("Line 1\n\nLine 2");
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit within the window, then blocks until it slides", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 100).allowed).toBe(true);
    const blocked = limiter.check("ip", 200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(800);
    expect(limiter.check("ip", 1001).allowed).toBe(true);
    expect(limiter.check("other-ip", 200).allowed).toBe(true);
  });
});
