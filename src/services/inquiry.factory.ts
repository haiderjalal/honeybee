import "server-only";

import { createInquiryNotifier } from "@/lib/email/notifiers";
import { getServerEnv } from "@/lib/env";

import { InquiryService } from "./inquiry.service";

let instance: InquiryService | null = null;

/** Lazily constructed so environment problems surface on first request, not at build time. */
export function getInquiryService(): InquiryService {
  instance ??= new InquiryService({ notifier: createInquiryNotifier(getServerEnv()) });
  return instance;
}
