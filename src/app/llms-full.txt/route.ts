import { buildLlmsFullTxt } from "@/lib/seo/llmsText";

export const dynamic = "force-static";

/** GET /llms-full.txt — expanded product, ordering and FAQ facts for AI assistants. */
export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
