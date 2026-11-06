import "server-only";

import { getServerEnv } from "@/lib/env";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * Supabase settings, or null while any of them is missing. Membership pages then explain that accounts are not
 * available yet, instead of failing.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const env = getServerEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) return null;
  return { url, anonKey, serviceRoleKey };
}

export function isMembershipStorageConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
