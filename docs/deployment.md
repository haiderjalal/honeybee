# Deployment (Vercel)

1. Import the GitHub repository into Vercel (framework preset: Next.js).
2. Add the environment variables from `.env.example` for **Production** (and Preview if wanted):
   - `NEXT_PUBLIC_SITE_URL` — the live domain, e.g. `https://www.honeybee.pk` (used for canonical URLs, sitemap, OG
     images and `llms.txt`; set it before the first production build).
   - `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, `INQUIRY_TO_EMAIL`.
   - Optional: `NEXT_PUBLIC_WHATSAPP_NUMBER`.
3. In Resend, verify the domain used by `INQUIRY_FROM_EMAIL` (SPF/DKIM DNS records).
4. Deploy, then send one test order request and confirm it arrives in `INQUIRY_TO_EMAIL`.

## Google Sheets order log (optional)

Every accepted order is also appended as one row to a Google Sheet, after the owner email has been sent. A sheet
problem never blocks an order.

1. Create a Google Sheet. In row 1, add these headers, in this order: `Created (PKT)`, `Reference`, `Name`, `Phone`,
   `Email`, `City`, `Address`, `Referred by`, `Notes`, `Items`, `Subtotal (PKR)`, `Status`. Name the tab `Orders`, or
   set `GOOGLE_SHEET_TAB` to its name.
2. In the Google Cloud Console, create a project, enable the **Google Sheets API**, and create a **service account**.
   Under the account's **Keys** tab, add a **JSON** key.
3. Share the sheet with the service account's email address (`client_email` in the JSON) as **Editor**. Keep the
   sheet private, because it holds customer details.
4. Add these variables in Vercel for Production:
   - `GOOGLE_SHEET_ID`: the long ID in the sheet's URL, between `/d/` and `/edit`.
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: the `client_email` value.
   - `GOOGLE_PRIVATE_KEY`: the `private_key` value, copied exactly, including the `BEGIN` and `END` lines.
   - Optional: `GOOGLE_SHEET_TAB`.
5. Redeploy. Recording turns on once the three required variables are set. If only some are set, orders still work
   and the problem is logged.

If a row cannot be written, the error is logged with the order reference, so add that order by hand. Rows are not
retried automatically, because a timed-out write may already have succeeded and a retry would duplicate the row.

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
