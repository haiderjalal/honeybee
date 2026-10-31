# Architecture

## Principles

- **Server-first.** Pages are Server Components and prerendered at build time (home, product pages, SEO files). Client
  components are small islands: intro, Pour Story, Honey Lab, cart, checkout form.
- **One source of truth.** Products and prices live in `src/constants/catalog.ts`. The browser never decides a price; the
  server re-prices every order from the catalogue.
- **Layered.** UI → hooks → services → lib. Route handlers stay thin (parse → validate → service → typed response).

## Folder structure

```
src/
  app/                    Routes only: pages, metadata routes, route handlers
    api/inquiries/        POST order requests
    api/health/           Liveness probe
    honey/[slug]/         SSG product pages (+ per-product OG image)
    checkout/             Order request page (noindex)
    llms.txt, llms-full.txt, robots.ts, sitemap.ts, manifest.ts, opengraph-image.tsx
  components/
    art/                  Pure SVG artwork (Bee, HoneyJar, Honeycomb) tinted via CSS variables
    layout/               Navbar, Footer, Container, AppProviders, SmoothScroll
    shared/               SectionHeading, Reveal (CSS scroll-driven), JsonLd, PauseOffscreen
    ui/                   Button, form fields
  features/
    intro/                Swarm engine (pure), worker host, orchestrator, overlay
    hero/                 Hero + backdrop (server, CSS-only motion)
    pour-story/           Scroll timeline math + scene
    honey-lab/            Comb picker, draggable jars, harvest choreography
    cart/                 Zustand stores, hive drop zone, drawer
    catalog/              Variety showcase, add-to-hive panel
    inquiry/              Checkout view, form, submit hook
    marketing/            Promises, Process, FAQ, CTA
  services/               Catalogue lookups, InquiryService (business rules)
  lib/                    env, logger, rate limiter, validation schemas, email (Resend), SEO builders
  constants/              Catalogue, copy, routes, site config
  utils/                  Pure helpers (formatting, hex geometry, sanitising)
  types/                  Shared types
tests/
  unit/                   Vitest
  e2e/                    Playwright
```

## Animation system

| Effect                    | Technique                                              | Why                                               |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| Swarm intro               | Canvas 2D in a Web Worker (`OffscreenCanvas`)          | 70+ bees and 200+ shards without main-thread cost |
| Pour Story                | Motion `useScroll` → CSS variables (`--fill`, `--lid`) | One scroll source drives every jar                |
| Honey Lab                 | Motion `useAnimate` sequences + drag                   | Choreographed bee → drips → fill → lid            |
| Section reveals           | CSS `animation-timeline: view()`                       | Zero JavaScript; progressive enhancement          |
| Hero, waves, wings, drips | CSS keyframes                                          | No JS; paused while off-screen                    |

Performance safeguards:

- The intro overlay is server-rendered and gated by a tiny inline `<head>` script, so there is no flash and no layout
  shift. The page beneath pauses its animations while the overlay is up.
- Sections below the fold use `content-visibility: auto` with intrinsic sizes.
- `PauseOffscreen` pauses CSS animations in sections that are out of view (SVG transforms repaint on the main thread).
- Motion features (`domMax`) are code-split via `LazyMotion`; Lenis is loaded after the intro.
- Every effect respects `prefers-reduced-motion`.

## Cart

`useCartStore` (Zustand + `persist`) stores only `{ varietySlug, sizeId, quantity }`. Display prices are derived from the
catalogue. Hydration is manual (`skipHydration`) to avoid server/client mismatches, and stale items are dropped on
rehydrate. `useCartUiStore` holds transient UI state (drawer, drag-over-hive, add pulse, announcements).

## Order requests

```
InquiryForm (RHF + Zod) → POST /api/inquiries → rate limit → JSON size guard → Zod (shared schema)
  → honeypot check → InquiryService.submit
      → idempotency (10 min) → re-price from catalogue → sanitise → notifier.notifyOwner (required)
      → notifier.notifyCustomer (best effort)
```

`InquiryNotifier` is an interface: `ResendNotifier` in production, `ConsoleNotifier` for development and tests. A
database-backed order repository or WhatsApp notifier can be added behind the same interface without touching the UI or
route handler.

## Decisions

- **No database in v1.** The brief asked for email delivery only. Because the owner email is the only record, a failed
  owner email returns an error so the customer can retry (with the same idempotency key).
- **Cache Components disabled.** All pages are static; disabling it allows `dynamicParams = false`, which gives unknown
  product URLs a real 404 status instead of a soft 404.
- **In-memory rate limiting.** Per-instance on serverless; swap for a shared store (e.g. Upstash Redis) if abuse grows.
