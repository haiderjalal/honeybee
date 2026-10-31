# API

All responses use the shared envelope from `src/types/api.ts`:

```ts
{ success: true, message: string, data: T }
{ success: false, message: string, errors?: Record<string, string> }
```

## `POST /api/inquiries`

Creates an order request and emails it to the team.

**Request body**

| Field            | Type                                                        | Rules                                                                      |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `name`           | string                                                      | 2–80 characters                                                            |
| `phone`          | string                                                      | Pakistani mobile: `03XXXXXXXXX`, `+923…`, `00923…` (spaces/dashes allowed) |
| `email`          | string                                                      | Optional; valid email, ≤ 120 characters                                    |
| `city`           | string                                                      | 2–60 characters                                                            |
| `address`        | string                                                      | 8–300 characters                                                           |
| `notes`          | string                                                      | Optional; ≤ 500 characters                                                 |
| `items`          | `{ varietySlug, sizeId: "500g"\|"1kg"\|"2kg", quantity }[]` | 1–15 lines; quantity 1–20                                                  |
| `idempotencyKey` | UUID                                                        | Reuse when retrying the same submission                                    |
| `website`        | string                                                      | Honeypot — must be empty                                                   |

Prices are **not** accepted from the client; they are resolved from the catalogue.

**Responses**

| Status | Meaning                                                                  |
| ------ | ------------------------------------------------------------------------ |
| 201    | Created. `data.reference` is the order reference (e.g. `HB-261031-7K2Q`) |
| 400    | Body is not valid JSON                                                   |
| 413    | Body larger than 16 KB                                                   |
| 422    | Validation failed (`errors` maps field → message) or unknown product     |
| 429    | Rate limited (5 requests per 10 minutes per IP); see `Retry-After`       |
| 502    | Email delivery failed — safe to retry with the same `idempotencyKey`     |
| 500    | Unexpected error                                                         |

Errors never expose stack traces or provider details. Logs are structured JSON with personal data redacted.

## `GET /api/health`

Liveness probe: `{ "status": "ok", "time": "<ISO timestamp>" }`, never cached.

## Static text endpoints

| Path                    | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `/robots.txt`           | Crawl rules (AI crawlers explicitly allowed) |
| `/sitemap.xml`          | Home and product pages                       |
| `/llms.txt`             | Concise brief for AI assistants (GEO)        |
| `/llms-full.txt`        | Full product, ordering and FAQ facts         |
| `/manifest.webmanifest` | Web app manifest                             |
