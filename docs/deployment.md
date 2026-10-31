# Deployment (Vercel)

1. Import the GitHub repository into Vercel (framework preset: Next.js).
2. Add the environment variables from `.env.example` for **Production** (and Preview if wanted):
   - `NEXT_PUBLIC_SITE_URL` — the live domain, e.g. `https://www.honeybee.pk` (used for canonical URLs, sitemap, OG
     images and `llms.txt`; set it before the first production build).
   - `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, `INQUIRY_TO_EMAIL`.
   - Optional: `NEXT_PUBLIC_WHATSAPP_NUMBER`.
3. In Resend, verify the domain used by `INQUIRY_FROM_EMAIL` (SPF/DKIM DNS records).
4. Deploy, then send one test order request and confirm it arrives in `INQUIRY_TO_EMAIL`.

## Pre-release checklist

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Monitoring

- `GET /api/health` for uptime checks.
- Server logs are JSON lines; search for `"Inquiry delivery to owner failed"` to catch email problems.
- If Resend is not configured in production, order requests are **rejected** (the customer sees "please try again")
  and an error is logged — so orders are never silently lost. Set the Resend variables before going live.

## Rollback

Use Vercel's "Instant Rollback" to the previous deployment, fix on a branch, and redeploy after the checks above.
