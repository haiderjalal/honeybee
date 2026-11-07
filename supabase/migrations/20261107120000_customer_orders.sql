-- Customer orders (order requests), saved when they are placed so the admin Orders tab can list and search them.
--
-- DRAFT. Apply after the membership migration (20261106120000_membership_hive.sql). Test on a disposable project first.
--
-- Money is integer minor units (paisa). Row level security is on with no public policies, and the functions are
-- callable only by the service role, like the membership functions.

create table customer_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'confirmed', 'fulfilled', 'cancelled')),
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  referral text,
  notes text,
  subtotal_minor integer not null check (subtotal_minor >= 0),
  membership_discount_minor integer not null default 0 check (membership_discount_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (membership_discount_minor <= subtotal_minor),
  check (total_minor = subtotal_minor - membership_discount_minor)
);

create index customer_orders_created_idx on customer_orders (created_at desc);

create table customer_order_items (
  order_id uuid not null references customer_orders (id) on delete cascade,
  line_key text not null,
  name text not null,
  size_label text not null,
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  line_total_minor integer not null check (line_total_minor >= 0),
  primary key (order_id, line_key)
);

alter table customer_orders enable row level security;
alter table customer_order_items enable row level security;

-- Saves an order and its lines in one transaction. Idempotent: a repeated reference returns the existing order.
create or replace function customer_order_insert(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into customer_orders (
    reference, customer_name, phone, email, city, address, referral, notes,
    subtotal_minor, membership_discount_minor, total_minor, created_at
  ) values (
    p->>'reference', p->>'customer_name', p->>'phone', nullif(p->>'email', ''), p->>'city', p->>'address',
    nullif(p->>'referral', ''), nullif(p->>'notes', ''),
    (p->>'subtotal_minor')::integer, (p->>'membership_discount_minor')::integer, (p->>'total_minor')::integer,
    coalesce((p->>'created_at')::timestamptz, now())
  )
  on conflict (reference) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from customer_orders where reference = p->>'reference';
    return jsonb_build_object('result', 'existing', 'id', v_id);
  end if;

  insert into customer_order_items (order_id, line_key, name, size_label, quantity, unit_price_minor, line_total_minor)
  select v_id, item->>'line_key', item->>'name', item->>'size_label', (item->>'quantity')::integer,
         (item->>'unit_price_minor')::integer, (item->>'line_total_minor')::integer
    from jsonb_array_elements(p->'items') as item;

  return jsonb_build_object('result', 'inserted', 'id', v_id);
end;
$$;

-- Lists orders, newest first. The query matches part of the order reference. The status filter is optional.
create or replace function customer_orders_search(p jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_query text := upper(trim(coalesce(p->>'query', '')));
  v_status text := nullif(p->>'status', '');
  v_limit integer := least(greatest(coalesce((p->>'limit')::integer, 50), 1), 200);
  v_offset integer := greatest(coalesce((p->>'offset')::integer, 0), 0);
  v_total bigint;
  v_rows jsonb;
begin
  select count(*) into v_total
    from customer_orders o
   where (v_query = '' or upper(o.reference) like '%' || v_query || '%')
     and (v_status is null or o.status = v_status);

  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) into v_rows
    from (
      select o.*
        from customer_orders o
       where (v_query = '' or upper(o.reference) like '%' || v_query || '%')
         and (v_status is null or o.status = v_status)
       order by o.created_at desc
       limit v_limit offset v_offset
    ) r;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

-- One order with its lines, by reference.
create or replace function customer_order_get(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'order', (select to_jsonb(o) from customer_orders o where o.reference = p->>'reference'),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.line_key)
        from customer_order_items i
        join customer_orders o on o.id = i.order_id
       where o.reference = p->>'reference'
    ), '[]'::jsonb)
  );
$$;

-- Changes an order's status and writes the change to the audit log in the same transaction.
create or replace function customer_order_set_status(p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_before customer_orders;
  v_after customer_orders;
  v_reason text := trim(coalesce(p->>'reason', ''));
begin
  if trim(coalesce(p->>'actor', '')) = '' then
    raise exception 'membership: actor_required';
  end if;
  if v_reason = '' then
    raise exception 'membership: reason_required';
  end if;

  select * into v_before from customer_orders where reference = p->>'reference' for update;
  if not found then
    raise exception 'membership: order_not_found';
  end if;

  update customer_orders
     set status = p->>'status', updated_at = now()
   where id = v_before.id
   returning * into v_after;

  insert into membership_audit_events (actor, action, entity_type, entity_id, reason, before_state, after_state)
  values (
    p->>'actor', 'order.status_changed', 'customer_order', v_after.id::text, v_reason,
    to_jsonb(v_before), to_jsonb(v_after)
  );

  return to_jsonb(v_after);
exception
  when check_violation then
    raise exception 'membership: invalid_status';
end;
$$;

-- Only the service role may call these functions.
do $$
declare
  fn text;
  fns text[] := array[
    'customer_order_insert(jsonb)',
    'customer_orders_search(jsonb)',
    'customer_order_get(jsonb)',
    'customer_order_set_status(jsonb)'
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
