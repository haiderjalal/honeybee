import { NextResponse, type NextRequest } from "next/server";

import { createSessionClient } from "@/lib/supabase/session";

const DEFAULT_DESTINATION = "/membership/account";

/** Only same-site relative paths may be used as a destination after sign-in. */
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return DEFAULT_DESTINATION;
  return value;
}

/**
 * Completes the email sign-in link. The email template links here with the one-time token hash, and the token is
 * verified on the server before a session is created.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const failed = new URL(`${DEFAULT_DESTINATION}?auth=failed`, request.url);

  if (!tokenHash || type !== "email") return NextResponse.redirect(failed);

  const client = await createSessionClient();
  if (!client) return NextResponse.redirect(failed);

  const { error } = await client.auth.verifyOtp({ type: "email", token_hash: tokenHash });
  if (error) return NextResponse.redirect(failed);

  return NextResponse.redirect(new URL(safeNextPath(searchParams.get("next")), request.url));
}
