import "server-only";

import { createClient } from "@supabase/supabase-js";

import { MembershipRepository, type RpcCaller } from "@/services/membership/membership.repository";

import { getSupabaseConfig } from "./config";

/**
 * Service-role access to the membership RPCs. Only server code imports this, and the service role bypasses row
 * level security, so every caller must check the signed-in user first.
 */
function createServiceRoleRpcCaller(): RpcCaller | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  const client = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return async (name, payload) => {
    // Supabase passes named arguments, and every membership RPC takes a single jsonb argument called p.
    const { data, error } = await client.rpc(name, { p: payload });
    if (error) throw new Error(error.message);
    return data;
  };
}

let cached: MembershipRepository | null | undefined;

/** The membership repository, or null while Supabase is not configured. */
export function getMembershipRepository(): MembershipRepository | null {
  if (cached === undefined) {
    const rpc = createServiceRoleRpcCaller();
    cached = rpc ? new MembershipRepository(rpc) : null;
  }
  return cached;
}
