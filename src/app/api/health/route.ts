import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/health — liveness probe for uptime monitoring. */
export function GET(): NextResponse<{ status: "ok"; time: string }> {
  return NextResponse.json(
    { status: "ok", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
