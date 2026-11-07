import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { RpcCaller } from "@/services/membership/membership.repository";

import { getSupabaseConfig } from "./config";

/**
 * Service-role access to the database functions. Only server code imports this, and the service role bypasses row
 * level security, so every caller must check the signed-in admin or customer first.
 */
export function createServiceRoleRpcCaller(): RpcCaller | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  const client = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return async (name, payload) => {
    // Supabase passes named arguments, and every RPC in this project takes a single jsonb argument called p.
    const { data, error } = await client.rpc(name, { p: payload });
    if (error) throw new Error(error.message);
    return data;
  };
}
