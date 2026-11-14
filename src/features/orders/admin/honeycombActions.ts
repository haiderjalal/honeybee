"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES } from "@/constants/routes";
import { describeMembershipError } from "@/features/membership/membershipErrorCopy";
import { cleanHoneycombName } from "@/features/honeycomb/honeycombLayout";
import { logger } from "@/lib/logger";
import { getMembershipAdmin } from "@/lib/membership/access";
import { getCustomerOrderRepository } from "@/lib/supabase/customerOrderRepository";

import type { OrderActionState } from "./orderActionState";

const referenceSchema = z.object({
  reference: z.string().regex(/^HB-[A-Z0-9-]{4,40}$/, "Choose an order to update."),
});

/**
 * Shows or hides a customer on the public honeycomb, and sets the name on the cell. Only an admin can do this, and it
 * is recorded in the audit log. Switch it on only after the customer has agreed to be shown.
 */
export async function setHoneycombAction(_previous: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const admin = await getMembershipAdmin();
  const repo = getCustomerOrderRepository();
  if (!admin || !repo) return { status: "error", message: "You don't have permission to do that." };

  const parsed = referenceSchema.safeParse({ reference: String(formData.get("reference") ?? "") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Choose an order to update." };
  }

  const name = cleanHoneycombName(String(formData.get("display_name") ?? ""));
  if (!name.ok) return { status: "error", message: name.message };

  const show = formData.get("show") === "on";
  try {
    await repo.setHoneycomb({
      reference: parsed.data.reference,
      show,
      displayName: name.value,
      actor: admin.email?.trim() || admin.id,
      reason: show ? "Shown on the public honeycomb after the customer agreed" : "Hidden from the public honeycomb",
    });
    revalidatePath(ROUTES.adminOrders);
    revalidatePath(ROUTES.home);
    return {
      status: "ok",
      message: show
        ? "Saved. The customer is in the honeycomb family."
        : "Saved. The customer has been removed from the honeycomb.",
    };
  } catch (error) {
    logger.error("Honeycomb change failed", { reference: parsed.data.reference, error });
    return { status: "error", message: describeMembershipError(error) };
  }
}
