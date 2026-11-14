-- The honeycomb family: orders the customer has agreed to show on the public honeycomb.
--
-- DRAFT. Apply after the customer orders migration (20261107120000_customer_orders.sql). Test on a disposable project first.
--
-- Only an admin can turn the flag on, and every change is written to the audit log. The public read returns only a
-- customer's name and the order's date, never the phone number, address or amounts.

alter table customer_orders
  add column show_on_honeycomb boolean not null default false;

create index customer_orders_honeycomb_idx on customer_orders (created_at) where show_on_honeycomb;

-- Shows or hides one order on the honeycomb. The change and its audit entry are written in one transaction.
create or replace function customer_order_set_honeycomb(p jsonb)
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
     set show_on_honeycomb = (p->>'show')::boolean, updated_at = now()
   where id = v_before.id
   returning * into v_after;

  insert into membership_audit_events (actor, action, entity_type, entity_id, reason, before_state, after_state)
  values (
    p->>'actor', 'order.honeycomb_changed', 'customer_order', v_after.id::text, v_reason,
    to_jsonb(v_before), to_jsonb(v_after)
  );

  return to_jsonb(v_after);
end;
$$;

-- The public honeycomb: the first names and dates of agreed orders, oldest first so the comb grows over time.
-- Returns nothing else about the customer.
create or replace function customer_orders_honeycomb(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object('id', c.id, 'customer_name', c.customer_name, 'created_at', c.created_at)
    order by c.created_at
  ), '[]'::jsonb)
  from (
    select o.id, o.customer_name, o.created_at
      from customer_orders o
     where o.show_on_honeycomb
     order by o.created_at
     limit least(greatest(coalesce((p->>'limit')::integer, 200), 1), 200)
  ) c;
$$;

do $$
declare
  fn text;
  fns text[] := array[
    'customer_order_set_honeycomb(jsonb)',
    'customer_orders_honeycomb(jsonb)'
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
