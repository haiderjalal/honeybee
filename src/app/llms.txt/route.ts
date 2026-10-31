import { buildLlmsTxt } from "@/lib/seo/llmsText";

export const dynamic = "force-static";

/** GET /llms.txt — static, generated at build time from the catalogue. */
export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
