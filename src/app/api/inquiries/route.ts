import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rateLimit";
import { inquirySchema } from "@/lib/validations/inquiry.schema";
import { getInquiryService } from "@/services/inquiry.factory";

import type { ApiResponse, FieldErrors, InquiryReceipt } from "@/types/api";

const MAX_BODY_BYTES = 16 * 1024;
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

type InquiryResponse = NextResponse<ApiResponse<InquiryReceipt>>;

const fail = (status: number, message: string, errors?: FieldErrors, headers?: HeadersInit): InquiryResponse =>
  NextResponse.json({ success: false, message, errors }, { status, headers });

/** Prefers the platform-set real IP; the first X-Forwarded-For entry can be supplied by the visitor. */
function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return realIp || forwarded || "unknown";
}

/**
 * Reads the body as text, stopping as soon as it exceeds `maxBytes`, so an oversized request
 * is never buffered in full. Returns null when the limit is exceeded.
 */
async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/** POST /api/inquiries — validates an order request and hands it to the InquiryService. */
export async function POST(request: Request): Promise<InquiryResponse> {
  const rate = limiter.check(clientIp(request));
  if (!rate.allowed) {
    return fail(429, "Too many requests. Please wait a few minutes and try again.", undefined, {
      "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)),
    });
  }

  const raw = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (raw === null) return fail(413, "Your request is too large.");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "We couldn't read your request. Please try again.");
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      errors[field] ??= issue.message;
    }
    logger.info("Inquiry validation failed", { fields: Object.keys(errors) });
    return fail(422, "Please check the highlighted fields.", errors);
  }

  // Honeypot filled: pretend success so bots learn nothing.
  if (parsed.data.website) {
    logger.warn("Inquiry honeypot triggered", {});
    return NextResponse.json({
      success: true,
      message: "Thank you! We'll be in touch shortly.",
      data: { reference: "HB-RECEIVED" },
    });
  }

  try {
    const result = await getInquiryService().submit(parsed.data);
    if (!result.ok) return fail(result.reason === "invalid_items" ? 422 : 502, result.message);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! We'll call you shortly to confirm your order.",
        data: { reference: result.reference },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Unexpected inquiry error", { error });
    return fail(500, "Something went wrong on our side. Please try again.");
  }
}
