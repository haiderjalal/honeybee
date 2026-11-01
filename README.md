# HonyB

A premium, heavily animated storefront for **HonyB** raw honey. Customers explore Sidr, Acacia and Wildflower honey in
500 g, 1 kg and 2 kg jars (priced in PKR), drag jars into their "hive" (cart) and send an **order request** that is
emailed to the team through [Resend](https://resend.com). No payment is taken online — orders are confirmed by phone.

## Highlights

- **Swarm intro** — bees fly in from every edge, build a honeycomb and burst it open. Rendered on an `OffscreenCanvas`
  in a Web Worker so the main thread stays free (main-thread fallback included). Plays once per session; skipped for
  reduced-motion users and crawlers.
- **Pour Story** — a scroll-scrubbed scene where honey pours into the 500 g, 1 kg and 2 kg jars in turn.
- **Honey Lab** — pick a honeycomb, a bee harvests it, drips fill the jars, then drag a jar into the hive (with a
  keyboard/screen-reader "Add to hive" alternative).
- **Order requests by email** — validated on client and server (Zod), re-priced from the catalogue on the server,
  rate-limited, honeypot-protected, idempotent and delivered with retries.
- **SEO + GEO** — metadata on every route, Product / Organization / FAQ / Breadcrumb JSON-LD, generated Open Graph
  images, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `llms.txt` and `llms-full.txt`.

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Motion · Lenis · Zustand ·
React Hook Form + Zod · Resend · Vitest + Testing Library · Playwright.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

In development, without `RESEND_API_KEY`, the app uses the console email transport: order requests are logged instead
of emailed. In production, missing email settings make order requests fail visibly rather than be lost.

## Scripts

| Script                    | What it does                                    |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | Development server                              |
| `npm run build` / `start` | Production build / server                       |
| `npm run lint`            | ESLint                                          |
| `npm run typecheck`       | TypeScript (no emit)                            |
| `npm run format`          | Prettier (with Tailwind class sorting)          |
| `npm test`                | Unit tests (Vitest)                             |
| `npm run test:e2e`        | End-to-end tests (Playwright, desktop + mobile) |

Install the Playwright browser once with `npx playwright install chromium`.

## Editing products and prices

Everything about the products — names, descriptions, colours and **prices** — lives in
[`src/constants/catalog.ts`](src/constants/catalog.ts). The UI, emails, structured data and `llms.txt` all read from it,
and the server always re-prices orders from it.

Marketing copy (FAQ, ordering steps, promises) is in [`src/constants/content.ts`](src/constants/content.ts).

## Documentation

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Deployment](docs/deployment.md)
