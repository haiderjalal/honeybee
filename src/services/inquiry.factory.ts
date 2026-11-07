import "server-only";

import { createInquiryNotifier } from "@/lib/email/notifiers";
import { getServerEnv } from "@/lib/env";
import { createOrderRecorder } from "@/lib/google/orderSheet";
import { getCustomerOrderRepository } from "@/lib/supabase/customerOrderRepository";
import { getMembershipRepository } from "@/lib/supabase/membershipRepository";

import { createOrderMembershipPort } from "./membership/membershipOrderPort";
import { combineOrderRecorders, createCustomerOrderRecorder } from "./customerOrder.recorder";
import { InquiryService } from "./inquiry.service";

import type { OrderRecorder } from "./inquiry.types";

let instance: InquiryService | null = null;

/** Every order is kept in the sheet (when configured) and in the database (when Supabase is configured). */
function createOrderRecorders(env: ReturnType<typeof getServerEnv>): OrderRecorder | null {
  const orderRepository = getCustomerOrderRepository();
  const recorders = [
    createOrderRecorder(env),
    orderRepository ? createCustomerOrderRecorder(orderRepository) : null,
  ].filter((recorder): recorder is OrderRecorder => recorder !== null);

  return recorders.length > 0 ? combineOrderRecorders(recorders) : null;
}

/** Lazily constructed so environment problems surface on first request, not at build time. */
export function getInquiryService(): InquiryService {
  if (!instance) {
    const env = getServerEnv();
    const membershipRepository = getMembershipRepository();
    instance = new InquiryService({
      notifier: createInquiryNotifier(env),
      recorder: createOrderRecorders(env),
      // Without membership storage, orders are priced exactly as before.
      membership: membershipRepository ? createOrderMembershipPort(membershipRepository) : null,
    });
  }
  return instance;
}
