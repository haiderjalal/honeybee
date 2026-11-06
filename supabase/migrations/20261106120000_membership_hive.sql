-- The HonyB Hive membership schema (draft v2).
--
-- NOT APPLIED to any database. Tested against embedded Postgres in tests/unit/membershipDatabase.test.ts.
-- Apply to a disposable Supabase project first, then to production only after review.
--
-- Design rules:
--   * Money is integer minor units (paisa, 100 = PKR 1).
--   * A term copies the fee, allowance, rate, cap and minimum at activation, so later rule changes never rewrite it.
--   * Customers are Supabase Auth users (auth.users). Phone numbers are stored normalised as 03XXXXXXXXX.
--     Phone verification is not available yet, so the phone is recorded as provided.
--   * Row level security is on for every table with no policies. Only the server (service role) reads or writes.
--   * Every RPC takes one jsonb argument named p and returns jsonb, so Supabase RPC and tests call them the same way.
--     Business errors raise exceptions whose message starts with "membership:".

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table membership_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by text not null default 'bootstrap'
);

create table membership_terms (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users (id) on delete restrict,
  phone text not null check (phone ~ '^03[0-9]{9}$'),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  fee_minor integer not null check (fee_minor > 0),
  discount_allowance integer not null check (discount_allowance > 0),
  discount_rate_bps integer not null check (discount_rate_bps between 0 and 10000),
  max_discount_per_order_minor integer not null check (max_discount_per_order_minor >= 0),
  min_eligible_subtotal_minor integer not null check (min_eligible_subtotal_minor >= 0),
  discounts_used integer not null default 0 check (discounts_used >= 0),
  discounts_reserved integer not null default 0 check (discounts_reserved >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at),
  -- The allowance can never be overspent, even if two checkouts race.
  check (discounts_used + discounts_reserved <= discount_allowance),
  -- At most one live term per account and per phone number, with no overlapping periods. Cancelled terms are ignored.
  exclude using gist (customer_user_id with =, tstzrange(starts_at, expires_at, '[)') with &&)
    where (status <> 'cancelled'),
  exclude using gist (phone with =, tstzrange(starts_at, expires_at, '[)') with &&)
    where (status <> 'cancelled')
);

create table membership_payments (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users (id) on delete restrict,
  phone text not null check (phone ~ '^03[0-9]{9}$'),
  purpose text not null check (purpose in ('new', 'renewal')),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'pending_verification', 'verified', 'failed', 'cancelled')),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'PKR' check (currency = 'PKR'),
  -- What the customer says they paid with. This is a claim, never proof of payment.
  customer_reference text,
  -- Set only when an admin or an approved gateway has verified the money.
  provider text,
  provider_reference text,
  verified_at timestamptz,
  verified_by text,
  term_id uuid references membership_terms (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status <> 'verified'
    or (verified_at is not null and verified_by is not null and provider is not null
        and provider_reference is not null and term_id is not null)
  ),
  check (status = 'verified' or term_id is null)
);

-- A bank or gateway reference verifies at most one purchase.
create unique index membership_payments_verified_reference_key
  on membership_payments (provider, provider_reference)
  where provider_reference is not null;

-- One open purchase per account and per phone number.
create unique index membership_payments_open_per_customer
  on membership_payments (customer_user_id)
  where status in ('awaiting_payment', 'pending_verification');

create unique index membership_payments_open_per_phone
  on membership_payments (phone)
  where status in ('awaiting_payment', 'pending_verification');

-- A term is activated by at most one purchase.
create unique index membership_payments_term_key
  on membership_payments (term_id)
  where term_id is not null;

create table membership_redemptions (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references membership_terms (id) on delete restrict,
  order_reference text not null unique,
  status text not null check (status in ('reserved', 'consumed', 'released', 'restored')),
  eligible_subtotal_minor integer not null check (eligible_subtotal_minor >= 0),
  discount_minor integer not null check (discount_minor >= 0),
  reversed_discount_minor integer not null default 0,
  refunded_paid_minor integer not null default 0,
  reserved_at timestamptz not null default now(),
  consumed_at timestamptz,
  released_at timestamptz,
  restored_at timestamptz,
  updated_at timestamptz not null default now(),
  check (reversed_discount_minor between 0 and discount_minor),
  check (refunded_paid_minor >= 0),
  check (status <> 'consumed' or consumed_at is not null),
  check (status <> 'released' or released_at is not null),
  check (status <> 'restored' or restored_at is not null)
);

create index membership_redemptions_term_idx on membership_redemptions (term_id, status);

-- Original pricing and discount split per line, so refunds return exactly what was paid.
create table membership_redemption_lines (
  redemption_id uuid not null references membership_redemptions (id) on delete cascade,
  line_key text not null,
  quantity integer not null check (quantity > 0),
  refunded_quantity integer not null default 0 check (refunded_quantity between 0 and quantity),
  line_total_minor integer not null check (line_total_minor >= 0),
  discount_minor integer not null check (discount_minor >= 0),
  primary key (redemption_id, line_key)
);

create table membership_reminder_preferences (
  customer_user_id uuid primary key references auth.users (id) on delete cascade,
  renewal_reminders boolean not null default false,
  reorder_reminders boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Reminder claims. Inserting the dedupe key before sending means a reminder is never queued twice.
create table membership_reminder_messages (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  term_id uuid references membership_terms (id) on delete set null,
  customer_user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('renewal_30_days', 'renewal_7_days', 'reorder')),
  channel text not null check (channel in ('email')),
  scheduled_for timestamptz not null,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'skipped', 'failed')),
  created_at timestamptz not null default now()
);

create table membership_early_access (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('product', 'batch')),
  target_key text not null,
  member_opens_at timestamptz not null,
  public_opens_at timestamptz not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  check (public_opens_at > member_opens_at),
  unique (scope, target_key)
);

-- Append-only record of every membership change made by an admin or by verification.
create table membership_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  reason text not null check (length(trim(reason)) > 0),
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create or replace function membership_audit_events_reject_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'membership: audit events are append-only';
end;
$$;

create trigger membership_audit_events_append_only
  before update or delete on membership_audit_events
  for each row execute function membership_audit_events_reject_changes();

alter table membership_admins enable row level security;
alter table membership_terms enable row level security;
alter table membership_payments enable row level security;
alter table membership_redemptions enable row level security;
alter table membership_redemption_lines enable row level security;
alter table membership_reminder_preferences enable row level security;
alter table membership_reminder_messages enable row level security;
alter table membership_early_access enable row level security;
alter table membership_audit_events enable row level security;

-- ---------------------------------------------------------------------------
-- RPC functions. Each takes one jsonb payload p and returns jsonb.
-- Each runs as one transaction, so partial writes cannot happen.
-- ---------------------------------------------------------------------------

-- Account snapshot for the signed-in customer's own dashboard.
create or replace function membership_account_snapshot(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'terms', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.starts_at desc)
      from membership_terms t
      where t.customer_user_id = (p->>'user_id')::uuid
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pay.id, 'status', pay.status, 'purpose', pay.purpose, 'amount_minor', pay.amount_minor,
          'created_at', pay.created_at, 'verified_at', pay.verified_at, 'term_id', pay.term_id
        ) order by pay.created_at desc)
      from membership_payments pay
      where pay.customer_user_id = (p->>'user_id')::uuid
    ), '[]'::jsonb),
    'redemptions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', r.id, 'term_id', r.term_id, 'order_reference', r.order_reference, 'status', r.status,
          'discount_minor', r.discount_minor, 'reversed_discount_minor', r.reversed_discount_minor,
          'refunded_paid_minor', r.refunded_paid_minor, 'reserved_at', r.reserved_at,
          'consumed_at', r.consumed_at, 'released_at', r.released_at, 'restored_at', r.restored_at
        ) order by r.reserved_at desc)
      from membership_redemptions r
      join membership_terms t on t.id = r.term_id
      where t.customer_user_id = (p->>'user_id')::uuid
    ), '[]'::jsonb),
    'reminder_preferences', (
      select to_jsonb(rp) from membership_reminder_preferences rp
      where rp.customer_user_id = (p->>'user_id')::uuid
    )
  );
$$;

-- Opens a fee purchase. The unique indexes allow one open purchase per account and per phone.
create or replace function membership_create_purchase(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_row membership_payments;
begin
  insert into membership_payments (customer_user_id, phone, purpose, amount_minor)
  values (
    (p->>'user_id')::uuid,
    p->>'phone',
    p->>'purpose',
    (p->>'amount_minor')::integer
  )
  returning * into v_row;
  return to_jsonb(v_row);
exception
  when unique_violation then
    raise exception 'membership: purchase_open';
end;
$$;

-- Records what the customer says they paid. This does not activate anything.
create or replace function membership_submit_reference(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_row membership_payments;
begin
  update membership_payments
     set status = 'pending_verification',
         customer_reference = p->>'reference',
         updated_at = now()
   where id = (p->>'purchase_id')::uuid
     and customer_user_id = (p->>'user_id')::uuid
     and status = 'awaiting_payment'
  returning * into v_row;
  if not found then
    raise exception 'membership: purchase_closed';
  end if;
  return to_jsonb(v_row);
end;
$$;

-- Activates a term for a verified fee payment. Idempotent: a repeated call returns the existing term.
-- The TypeScript decision (decideActivation) runs first; this function re-checks under a row lock.
create or replace function membership_verify_payment(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_pay membership_payments;
  v_term membership_terms;
begin
  select * into v_pay from membership_payments where id = (p->>'purchase_id')::uuid for update;
  if not found then
    raise exception 'membership: purchase_not_found';
  end if;

  if v_pay.status = 'verified' then
    return jsonb_build_object('result', 'already_activated', 'term_id', v_pay.term_id);
  end if;
  if v_pay.status not in ('awaiting_payment', 'pending_verification') then
    raise exception 'membership: purchase_closed';
  end if;
  if (p->>'amount_minor')::integer <> v_pay.amount_minor then
    raise exception 'membership: amount_mismatch';
  end if;

  insert into membership_terms (
    customer_user_id, phone, status, starts_at, expires_at, fee_minor, discount_allowance,
    discount_rate_bps, max_discount_per_order_minor, min_eligible_subtotal_minor
  ) values (
    v_pay.customer_user_id, v_pay.phone, 'active',
    (p->>'starts_at')::timestamptz, (p->>'expires_at')::timestamptz,
    (p->>'fee_minor')::integer, (p->>'discount_allowance')::integer,
    (p->>'discount_rate_bps')::integer, (p->>'max_discount_per_order_minor')::integer,
    (p->>'min_eligible_subtotal_minor')::integer
  )
  returning * into v_term;

  update membership_payments
     set status = 'verified',
         provider = p->>'provider',
         provider_reference = p->>'provider_reference',
         verified_at = now(),
         verified_by = p->>'actor',
         term_id = v_term.id,
         updated_at = now()
   where id = v_pay.id;

  insert into membership_audit_events (actor, action, entity_type, entity_id, reason, after_state)
  values (
    p->>'actor', 'payment.verified', 'membership_payment', v_pay.id::text,
    coalesce(nullif(trim(p->>'reason'), ''), 'Fee payment verified'),
    jsonb_build_object('term_id', v_term.id, 'provider', p->>'provider', 'provider_reference', p->>'provider_reference')
  );

  return jsonb_build_object('result', 'activated', 'term_id', v_term.id);
exception
  when unique_violation then
    raise exception 'membership: reference_already_used';
  when exclusion_violation then
    raise exception 'membership: already_member';
end;
$$;

-- Reserves one discounted order against the term. Idempotent per order reference.
-- The term row lock serialises concurrent checkouts, so the allowance can never be overspent.
create or replace function membership_reserve_redemption(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_term membership_terms;
  v_existing membership_redemptions;
  v_row membership_redemptions;
begin
  select * into v_term from membership_terms where id = (p->>'term_id')::uuid for update;
  if not found then
    raise exception 'membership: term_not_found';
  end if;

  select * into v_existing from membership_redemptions where order_reference = p->>'order_reference';
  if found then
    return jsonb_build_object('result', 'existing', 'redemption_id', v_existing.id, 'status', v_existing.status);
  end if;

  if v_term.status <> 'active' or now() < v_term.starts_at or now() >= v_term.expires_at then
    raise exception 'membership: term_not_active';
  end if;
  if v_term.discounts_used + v_term.discounts_reserved >= v_term.discount_allowance then
    raise exception 'membership: allowance_used';
  end if;

  update membership_terms
     set discounts_reserved = discounts_reserved + 1, updated_at = now()
   where id = v_term.id;

  insert into membership_redemptions (
    term_id, order_reference, status, eligible_subtotal_minor, discount_minor
  ) values (
    v_term.id, p->>'order_reference', 'reserved',
    (p->>'eligible_subtotal_minor')::integer, (p->>'discount_minor')::integer
  )
  returning * into v_row;

  insert into membership_redemption_lines (redemption_id, line_key, quantity, line_total_minor, discount_minor)
  select v_row.id, line->>'line_key', (line->>'quantity')::integer,
         (line->>'line_total_minor')::integer, (line->>'discount_minor')::integer
    from jsonb_array_elements(p->'lines') as line;

  return jsonb_build_object('result', 'reserved', 'redemption_id', v_row.id);
end;
$$;

-- Applies one lifecycle change with a compare-and-set on the redemption's current state.
-- The TypeScript state machine decides the change; this function applies it atomically or not at all.
create or replace function membership_apply_redemption_change(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_r membership_redemptions;
  v_status text := p->>'new_status';
  v_before jsonb;
begin
  select * into v_r from membership_redemptions where order_reference = p->>'order_reference' for update;
  if not found then
    raise exception 'membership: redemption_not_found';
  end if;

  -- Every change is attributed. The actor is an admin or a named system process, and the reason is never blank.
  if trim(coalesce(p->>'actor', '')) = '' then
    raise exception 'membership: actor_required';
  end if;
  if trim(coalesce(p->>'reason', '')) = '' then
    raise exception 'membership: reason_required';
  end if;
  v_before := to_jsonb(v_r);

  if v_r.status <> p->>'expected_status'
     or v_r.reversed_discount_minor <> (p->>'expected_reversed_minor')::integer
     or v_r.refunded_paid_minor <> (p->>'expected_refunded_minor')::integer then
    raise exception 'membership: stale_redemption';
  end if;

  perform 1 from membership_terms where id = v_r.term_id for update;

  update membership_terms
     set discounts_used = discounts_used + (p->>'used_delta')::integer,
         discounts_reserved = discounts_reserved + (p->>'reserved_delta')::integer,
         updated_at = now()
   where id = v_r.term_id;

  update membership_redemptions
     set status = v_status,
         reversed_discount_minor = (p->>'new_reversed_minor')::integer,
         refunded_paid_minor = (p->>'new_refunded_minor')::integer,
         consumed_at = case when v_status = 'consumed' then coalesce(consumed_at, now()) else consumed_at end,
         released_at = case when v_status = 'released' then now() else released_at end,
         restored_at = case when v_status = 'restored' then now() else restored_at end,
         updated_at = now()
   where id = v_r.id
   returning * into v_r;

  update membership_redemption_lines l
     set refunded_quantity = (x->>'refunded_quantity')::integer
    from jsonb_array_elements(coalesce(p->'line_refunds', '[]'::jsonb)) as x
   where l.redemption_id = v_r.id
     and l.line_key = x->>'line_key';

  insert into membership_audit_events (actor, action, entity_type, entity_id, reason, before_state, after_state)
  values (
    p->>'actor',
    coalesce(p->>'audit_action', 'redemption.changed'),
    'membership_redemption',
    v_r.id::text,
    trim(p->>'reason'),
    v_before,
    to_jsonb(v_r)
  );

  return jsonb_build_object('result', 'updated', 'status', v_r.status);
exception
  when check_violation then
    raise exception 'membership: counter_invalid';
end;
$$;

-- Admin correction of a term. The reason is required and is written to the audit log in the same transaction.
create or replace function membership_admin_correct_term(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_term membership_terms;
  v_before jsonb;
  v_reason text := trim(coalesce(p->>'reason', ''));
begin
  if v_reason = '' then
    raise exception 'membership: reason_required';
  end if;

  select * into v_term from membership_terms where id = (p->>'term_id')::uuid for update;
  if not found then
    raise exception 'membership: term_not_found';
  end if;
  v_before := to_jsonb(v_term);

  update membership_terms
     set status = coalesce(p->>'status', status),
         expires_at = coalesce((p->>'expires_at')::timestamptz, expires_at),
         discounts_used = coalesce((p->>'discounts_used')::integer, discounts_used),
         updated_at = now()
   where id = v_term.id
   returning * into v_term;

  insert into membership_audit_events (actor, action, entity_type, entity_id, reason, before_state, after_state)
  values (p->>'actor', 'term.corrected', 'membership_term', v_term.id::text, v_reason, v_before, to_jsonb(v_term));

  return to_jsonb(v_term);
exception
  when check_violation then
    raise exception 'membership: correction_invalid';
  when exclusion_violation then
    raise exception 'membership: correction_overlaps';
end;
$$;

-- Records a reminder for dedupe. Returns claimed = false when the same reminder already exists.
create or replace function membership_claim_reminder(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into membership_reminder_messages (
    dedupe_key, term_id, customer_user_id, kind, channel, scheduled_for
  ) values (
    p->>'dedupe_key', nullif(p->>'term_id', '')::uuid, (p->>'user_id')::uuid,
    p->>'kind', p->>'channel', (p->>'scheduled_for')::timestamptz
  )
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  return jsonb_build_object('claimed', v_id is not null);
end;
$$;

-- Saves the customer's reminder choices. Reorder reminders are always opt-in, so the default is false.
create or replace function membership_save_reminder_preferences(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_row membership_reminder_preferences;
begin
  insert into membership_reminder_preferences (customer_user_id, renewal_reminders, reorder_reminders, updated_at)
  values (
    (p->>'user_id')::uuid,
    (p->>'renewal_reminders')::boolean,
    (p->>'reorder_reminders')::boolean,
    now()
  )
  on conflict (customer_user_id) do update
    set renewal_reminders = excluded.renewal_reminders,
        reorder_reminders = excluded.reorder_reminders,
        updated_at = now()
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

-- Admin lists: purchases awaiting verification, oldest first.
create or replace function membership_admin_pending_payments(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', pay.id, 'customer_user_id', pay.customer_user_id, 'phone', pay.phone,
      'purpose', pay.purpose, 'amount_minor', pay.amount_minor,
      'customer_reference', pay.customer_reference, 'created_at', pay.created_at
    ) order by pay.created_at), '[]'::jsonb)
  from membership_payments pay
  where pay.status = 'pending_verification';
$$;

-- Admin search by phone fragment or account id. Returns up to p.limit terms, newest first.
create or replace function membership_admin_search_terms(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(t) order by t.starts_at desc), '[]'::jsonb)
  from (
    select *
    from membership_terms
    -- A phone search needs at least four digits. Without that guard, an empty or non-numeric query would match
    -- every member. An account id matches exactly.
    where (
      length(regexp_replace(coalesce(p->>'query', ''), '[^0-9]', '', 'g')) >= 4
      and phone like '%' || regexp_replace(coalesce(p->>'query', ''), '[^0-9]', '', 'g') || '%'
    )
       or customer_user_id::text = lower(trim(coalesce(p->>'query', '')))
    order by starts_at desc
    limit least(coalesce((p->>'limit')::integer, 50), 200)
  ) t;
$$;

-- Admin detail for one term: its redemptions, purchases and audit history.
create or replace function membership_admin_term_detail(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'term', (select to_jsonb(t) from membership_terms t where t.id = (p->>'term_id')::uuid),
    'redemptions', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.reserved_at desc)
      from membership_redemptions r where r.term_id = (p->>'term_id')::uuid
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(to_jsonb(pay) order by pay.created_at desc)
      from membership_payments pay where pay.term_id = (p->>'term_id')::uuid
    ), '[]'::jsonb),
    'audit', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc)
      from membership_audit_events a
      where a.entity_id = (p->>'term_id')
         or a.entity_id in (select pay.id::text from membership_payments pay where pay.term_id = (p->>'term_id')::uuid)
         or a.entity_id in (select r.id::text from membership_redemptions r where r.term_id = (p->>'term_id')::uuid)
    ), '[]'::jsonb)
  );
$$;

-- Reporting for a period, grouped by when each order was reserved. Fees and product discounts are reported
-- separately, and fees are not treated as profit.
create or replace function membership_report(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  with period_redemptions as (
    select r.*
    from membership_redemptions r
    where r.reserved_at >= (p->>'from')::timestamptz and r.reserved_at < (p->>'to')::timestamptz
  ),
  period_fees as (
    select pay.amount_minor
    from membership_payments pay
    where pay.status = 'verified'
      and pay.verified_at >= (p->>'from')::timestamptz and pay.verified_at < (p->>'to')::timestamptz
  )
  select jsonb_build_object(
    'fees_collected_minor', coalesce((select sum(amount_minor) from period_fees), 0),
    'fee_payments', (select count(*) from period_fees),
    'discounts_reserved_minor', coalesce((select sum(discount_minor) from period_redemptions where status = 'reserved'), 0),
    'discounts_granted_minor', coalesce((select sum(discount_minor) from period_redemptions where status in ('consumed', 'restored')), 0),
    'discounts_reversed_minor', coalesce((select sum(reversed_discount_minor) from period_redemptions), 0),
    'net_discount_cost_minor', coalesce((select sum(discount_minor - reversed_discount_minor) from period_redemptions where status in ('consumed', 'restored')), 0),
    'member_orders_fulfilled', (select count(*) from period_redemptions where status in ('consumed', 'restored')),
    'member_orders_pending', (select count(*) from period_redemptions where status = 'reserved'),
    'member_orders_released', (select count(*) from period_redemptions where status = 'released'),
    'refunds_minor', coalesce((select sum(refunded_paid_minor) from period_redemptions), 0),
    'refunded_orders', (select count(*) from period_redemptions where refunded_paid_minor > 0)
  );
$$;

-- One fee purchase with its customer's terms, for checking it against the activation rules.
create or replace function membership_find_purchase(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'purchase', (select to_jsonb(pay) from membership_payments pay where pay.id = (p->>'purchase_id')::uuid),
    'customer_terms', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.starts_at desc)
      from membership_terms t
      where t.customer_user_id = (
        select pay.customer_user_id from membership_payments pay where pay.id = (p->>'purchase_id')::uuid
      )
    ), '[]'::jsonb)
  );
$$;

-- Whether a Supabase user is an admin. Admins are granted by inserting into membership_admins (see docs).
create or replace function membership_is_admin(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'admin', exists (select 1 from membership_admins a where a.user_id = (p->>'user_id')::uuid)
  );
$$;

-- One redemption with its line allocation, looked up by order reference.
create or replace function membership_find_redemption(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'redemption', (select to_jsonb(r) from membership_redemptions r where r.order_reference = p->>'order_reference'),
    'lines', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.line_key)
      from membership_redemption_lines l
      join membership_redemptions r on r.id = l.redemption_id
      where r.order_reference = p->>'order_reference'
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Access control. Only the service role may call these functions. Anonymous and signed-in browser clients may not.
-- The DO block skips roles that do not exist (for example in a plain Postgres test database).
-- ---------------------------------------------------------------------------

do $$
declare
  fn text;
  fns text[] := array[
    'membership_account_snapshot(jsonb)',
    'membership_create_purchase(jsonb)',
    'membership_submit_reference(jsonb)',
    'membership_verify_payment(jsonb)',
    'membership_reserve_redemption(jsonb)',
    'membership_apply_redemption_change(jsonb)',
    'membership_admin_correct_term(jsonb)',
    'membership_claim_reminder(jsonb)',
    'membership_save_reminder_preferences(jsonb)',
    'membership_admin_pending_payments(jsonb)',
    'membership_admin_search_terms(jsonb)',
    'membership_admin_term_detail(jsonb)',
    'membership_report(jsonb)',
    'membership_is_admin(jsonb)',
    'membership_find_redemption(jsonb)',
    'membership_find_purchase(jsonb)'
  ];
  role_name text;
begin
  foreach fn in array fns loop
    execute format('revoke all on function %s from public', fn);
    foreach role_name in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = role_name) then
        execute format('revoke all on function %s from %I', fn, role_name);
      end if;
    end loop;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', fn);
    end if;
  end loop;
end;
$$;
