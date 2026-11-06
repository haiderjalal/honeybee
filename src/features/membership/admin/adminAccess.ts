import "server-only";

import { getMembershipAdmin } from "@/lib/membership/access";
import { getMembershipRepository } from "@/lib/supabase/membershipRepository";
import type { MembershipRepository } from "@/services/membership/membership.repository";

export interface AdminContext {
  repo: MembershipRepository;
  /** Recorded in the audit log: the admin's email, or their user id when they have no email. */
  actor: string;
}

export type AdminAccess = { ok: true; context: AdminContext } | { ok: false; reason: "unavailable" | "forbidden" };

/**
 * The membership repository and the signed-in admin. Every admin page and action calls this on the server.
 * Storage is checked first, so a deployment without storage reports that it is unavailable.
 */
export async function getAdminContext(): Promise<AdminAccess> {
  const repo = getMembershipRepository();
  if (!repo) return { ok: false, reason: "unavailable" };

  const admin = await getMembershipAdmin();
  if (!admin) return { ok: false, reason: "forbidden" };

  return { ok: true, context: { repo, actor: admin.email?.trim() || admin.id } };
}
