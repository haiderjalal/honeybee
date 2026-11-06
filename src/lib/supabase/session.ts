import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "./config";

export interface SignedInUser {
  id: string;
  email: string | null;
}

/** Supabase client bound to the visitor's cookies. It acts as the visitor, so row level security applies. */
export async function createSessionClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot write cookies. The session refreshes on the next route or action instead.
        }
      },
    },
  });
}

/** The verified signed-in user, or null. Uses getUser, which checks the token with Supabase, not just the cookie. */
export async function getSignedInUser(): Promise<SignedInUser | null> {
  const client = await createSessionClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
