import "server-only";

import { createInquiryNotifier } from "@/lib/email/notifiers";
import { getServerEnv } from "@/lib/env";
import { createOrderRecorder } from "@/lib/google/orderSheet";
import { getMembershipRepository } from "@/lib/supabase/membershipRepository";

import { createOrderMembershipPort } from "./membership/membershipOrderPort";
import { InquiryService } from "./inquiry.service";

let instance: InquiryService | null = null;

/** Lazily constructed so environment problems surface on first request, not at build time. */
export function getInquiryService(): InquiryService {
  if (!instance) {
    const env = getServerEnv();
    const membershipRepository = getMembershipRepository();
    instance = new InquiryService({
      notifier: createInquiryNotifier(env),
      recorder: createOrderRecorder(env),
      // Without membership storage, orders are priced exactly as before.
      membership: membershipRepository ? createOrderMembershipPort(membershipRepository) : null,
    });
  }
  return instance;
}
