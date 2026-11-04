import "server-only";

import { createInquiryNotifier } from "@/lib/email/notifiers";
import { getServerEnv } from "@/lib/env";
import { createOrderRecorder } from "@/lib/google/orderSheet";

import { InquiryService } from "./inquiry.service";

let instance: InquiryService | null = null;

/** Lazily constructed so environment problems surface on first request, not at build time. */
export function getInquiryService(): InquiryService {
  if (!instance) {
    const env = getServerEnv();
    instance = new InquiryService({ notifier: createInquiryNotifier(env), recorder: createOrderRecorder(env) });
  }
  return instance;
}
