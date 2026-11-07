import "server-only";

import { MembershipRepository } from "@/services/membership/membership.repository";

import { createServiceRoleRpcCaller } from "./serviceRpc";

let cached: MembershipRepository | null | undefined;

/** The membership repository, or null while Supabase is not configured. */
export function getMembershipRepository(): MembershipRepository | null {
  if (cached === undefined) {
    const rpc = createServiceRoleRpcCaller();
    cached = rpc ? new MembershipRepository(rpc) : null;
  }
  return cached;
}
