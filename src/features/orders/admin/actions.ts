"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { describeMembershipError } from "@/features/membership/membershipErrorCopy";
import { logger } from "@/lib/logger";
import { getMembershipAdmin } from "@/lib/membership/access";
import { getCustomerOrderRepository } from "@/lib/supabase/customerOrderRepository";
import { CUSTOMER_ORDER_STATUSES } from "@/services/customerOrder.repository";

import type { OrderActionState } from "./orderActionState";

const statusChangeSchema = z.object({
  reference: z.string().regex(/^HB-[A-Z0-9-]{4,40}$/, "Choose an order to update."),
  status: z.enum(CUSTOMER_ORDER_STATUSES, { message: "Choose a valid order status." }),
  reason: z
    .string()
    .trim()
    .min(3, "Add a short note for the audit log, such as 'Confirmed by phone'.")
    .max(200, "Keep the note under 200 characters."),
});

/** Changes an order's status. The admin is checked on the server, and the change is written to the audit log. */
export async function setOrderStatusAction(_previous: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const admin = await getMembershipAdmin();
  const repo = getCustomerOrderRepository();
  if (!admin || !repo) return { status: "error", message: "You don't have permission to do that." };

  const parsed = statusChangeSchema.safeParse({
    reference: String(formData.get("reference") ?? ""),
    status: String(formData.get("status") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  try {
    await repo.setStatus({
      reference: parsed.data.reference,
      status: parsed.data.status,
      actor: admin.email?.trim() || admin.id,
      reason: parsed.data.reason,
    });
    revalidatePath(ROUTES.adminOrders);
    return { status: "ok", message: "Order status saved and recorded in the audit log." };
  } catch (error) {
    logger.error("Order status change failed", { reference: parsed.data.reference, error });
    return { status: "error", message: describeMembershipError(error) };
  }
}
