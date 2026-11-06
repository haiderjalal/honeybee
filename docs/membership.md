# The HonyB Hive membership

Annual paid membership: PKR 999 once per term, six discounted orders per 12-month term, 10% off eligible honey.

## Status

| Area | State |
| --- | --- |
| Central rules and copy | Built — `src/constants/membership.ts`, `src/constants/membershipContent.ts` |
| Pure rules (terms, discount, redemptions, activation, sales gate, reminders) | Built, unit tested |
| Database schema and atomic functions | Built as a draft migration — `supabase/migrations/20261106120000_membership_hive.sql`. **Not applied to any Supabase project.** Tested against embedded Postgres |
| Repository and service layer | Built — `src/services/membership/membership.repository.ts`, `membership.service.ts` |
| Email sign-in (Supabase Auth, mail through Resend) | Built — `src/features/membership/authActions.ts`, `src/app/auth/confirm/route.ts`. Needs Supabase project configuration (below) |
| Member discount at order creation | Built — `InquiryService` reserves the discount for signed-in members and releases it if delivery fails |
| Checkout discount line | Built — `MemberDiscountSummary` shows the discount before submission for signed-in members |
| Customer account page `/membership/account` | Built. Signed-out visitors get email sign-in; signed-in members see status, dates, allowance, savings, history, consent toggles and renewal. Renewal is disabled while sales are closed |
| Admin area `/admin/membership` | Built. Pending payment verification, member search and detail with corrections, order fulfilment, release and refund, and a reporting summary. Non-admins get a 404. Verification and corrections are audited; order actions are audited with the admin's email |
| Public `/membership` page with calculator and FAQ | Built. `noindex` and not linked in nav until sales open |
| Fee payment: manual bank transfer with admin verification | Built as a workflow. The customer submits a reference, and an admin verifies it against the bank statement |
| Early access for products and batches | **Not built.** The table is drafted, but the admin controls and the server-side purchase check are missing |
| Reminders | Planner, dedupe and channel boundary built. **No sender configured**, so nothing is sent. Scheduler not wired |
| Public sales | **Closed.** `MEMBERSHIP_LAUNCH` flags are all false |

## Launch requirements (public sales stay closed until all are true)

`MEMBERSHIP_LAUNCH` in `src/constants/membership.ts`:

1. `feeRefundPolicyPublished` — the fee refund and cancellation policy is agreed and published. **Not decided.**
2. `paymentRouteConfigured` — a real route for fees exists. Manual transfer with admin verification is the planned route, and it needs your go-ahead.
3. `adminVerificationAvailable` — the admin area is deployed and the verification workflow has been tested with real transfers.
4. `storageConfigured` — the migration is applied to the production Supabase project and the environment variables are set.

Flip a flag only when its work is genuinely done. `getMembershipSalesBlockers()` lists the open ones.

## Setup (Supabase and email)

Steps for you, in order. None of these has been done for you.

1. **Create or choose a Supabase project** for HonyB. Use a disposable project to test the migration first.
2. **Apply the migration** to that project:
   ```bash
   supabase db push
   ```
   or run `supabase/migrations/20261106120000_membership_hive.sql` in the SQL editor. The file is not applied yet.
3. **Make the first admin** after the migration, by signing in once (so the account exists) and then running, with the user's id:
   ```sql
   insert into membership_admins (user_id, granted_by) values ('<auth user id>', 'bootstrap');
   ```
4. **Configure email sign-in:**
   - Authentication → SMTP settings: point Supabase at Resend's SMTP server with a sender on a verified domain.
   - Authentication → Email templates → Magic link: link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/membership/account`.
   - Authentication → URL configuration: add your site URL to the allowed redirect list.
5. **Set environment variables** in `.env.local` and Vercel. Names are in `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only, never prefixed with `NEXT_PUBLIC_`)

Until these are set, membership pages say accounts are not available, and orders are priced exactly as before.

## Data model and concurrency

The migration defines the tables and atomic functions. The database enforces the rules that matter most:

- **One live term per account and per phone** (exclusion constraints on overlapping periods).
- **One open fee purchase per account and per phone** (partial unique indexes).
- **A bank reference verifies at most one purchase** (unique index on provider and reference).
- **The allowance cannot be overspent** (check constraint, plus a row lock on the term in every reservation).
- **Repeated verification or reservation is idempotent** (returns the existing term or redemption).
- **Audit events are append-only** (trigger). Every admin correction and every order lifecycle change (fulfil,
  release, refund, restore, and releases made by the checkout) writes an audit row with the actor, the reason and the
  before and after states, in the same transaction as the change. A change without an actor or reason is refused.
- **Phone search** needs at least four digits, or an exact account id. An empty or short query returns nothing.
- **Row level security is on with no public policies**, and the functions are callable only by the service role.

Every RPC takes one `jsonb` argument `p` and returns `jsonb`. Business errors raise `membership: <code>`.

### What the database tests do and do not prove

`tests/unit/membershipDatabase.test.ts` and `tests/unit/membershipOrderFlow.test.ts` run the real migration in
embedded Postgres (PGlite). They prove the constraints, idempotency, reservation counting and refund arithmetic.
The engine runs one connection, so they **cannot prove row-lock behaviour under real concurrent connections**. That
needs an integration test against a real Supabase or Postgres instance before launch.

## Decisions to confirm

1. **Sale jars are excluded line by line.** The discount applies to regular-price honey. A sale jar in an order does
   not block the discount on other jars. The alternative is to drop the discount for the whole order.
2. **Minimum and cap are measured on the eligible subtotal**, not the whole basket.
3. **Expiry** is 12 calendar months later at the same Pakistan wall-clock time. The end is exclusive, so the expiry
   instant is already expired. 29 February becomes 28 February.
4. **Unused discounts lapse** when a term ends.
5. **A full refund restores the allowance** to the original term, even if that term has since ended. Dates never change.
6. **Renewal** starts a new term at verification, not at the old expiry.
7. **A tie** between the membership discount and another promotion goes to the membership discount.
8. **Rounding** is half up to the paisa. Per-line discount shares add up exactly to the order discount.
9. **Phone numbers are stored normalised as 03XXXXXXXXX, not hashed.** Hashing would need a secret and gives little
   protection for numbers this short. Phone verification is not available (no SMS provider), so the phone is recorded
   as given. Duplicate prevention uses it anyway.
10. **Order references are not linked to a database order.** Orders still live in email and the sheet. Membership
    reservations are keyed by the order reference, and the admin area fulfils, releases or refunds by that reference.
11. **Admin actions are attributed to the admin's email.** Fulfilment, release and refund have no free-text reason
    field yet, so each records a standard reason. Add a reason field if you want one recorded per action.
12. **Admin dates use Pakistan time** (UTC+5), the same as the term expiry rule.

## Undecided policy (deliberately not invented)

- **Membership-fee refund and cancellation policy.** Needed before sales open. The FAQ covers only order-level
  cancellation.
- **Payment route.** Manual transfer with verification is the planned route. Online payment needs a provider and
  credentials, and none has been configured.
- **Reminder sender.** Renewal reminders need a messaging channel and consent wording. None is configured, so the
  dispatcher refuses to claim or send anything.

## Known gaps and risks

- **Reservation after a failed reservation response.** If the database commits a reservation but the response is
  lost, the order goes ahead at regular prices, and the reservation stays open. The error log includes the reference,
  and the admin area can release it.
- **Stale concurrent changes** raise `membership: stale_redemption`. The caller reloads and retries.
- **Reorder reminders** are stored as preferences but never planned, because there is no order cycle to base them on.
- **Early access** is not enforced anywhere.
- **Admin member search puts the phone digits in the URL** (`?q=`), so they reach browser history and server access
  logs. This was briefed as a GET form. Moving the search to a server action would fix it, and I recommend doing that
  before launch. It is your call, since the change costs some UX.
- **Admin not-found status.** The admin page returns the 404 page for non-admins. In the dev server the HTTP status
  was 200, so check the status code on a production build.
- **Account and admin pages** were checked by type, lint and build only. No signed-in flow has been run against a
  live Supabase project, and the 375 px layout has not been checked in a browser.
- **Reservations at checkout** are not in the audit log, because they are system actions. The reservation row keeps
  its own timestamp.

## Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
