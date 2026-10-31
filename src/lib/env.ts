import "server-only";

import { z } from "zod";

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    RESEND_API_KEY: z.string().trim().optional(),
    INQUIRY_TO_EMAIL: z.email().optional(),
    INQUIRY_FROM_EMAIL: z.string().trim().min(3).optional(),
    /** "console" logs emails instead of sending (local development and e2e tests). */
    EMAIL_TRANSPORT: z.enum(["resend", "console"]).optional(),
  })
  .superRefine((env, ctx) => {
    const transport = env.EMAIL_TRANSPORT ?? (env.RESEND_API_KEY ? "resend" : "console");
    if (transport !== "resend") return;
    for (const key of ["RESEND_API_KEY", "INQUIRY_TO_EMAIL", "INQUIRY_FROM_EMAIL"] as const) {
      if (!env[key])
        ctx.addIssue({ code: "custom", path: [key], message: `${key} is required to send email with Resend.` });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Validated server environment. Throws a descriptive error on misconfiguration. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid server environment — ${problems}`);
  }
  cached = parsed.data;
  return cached;
}
