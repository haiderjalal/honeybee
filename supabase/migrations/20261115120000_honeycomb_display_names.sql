-- Lets an admin choose the name shown on a honeycomb cell, in place of the name generated from the customer's name.
--
-- DRAFT. Apply after the honeycomb migration (20261114120000_honeycomb.sql). Test on a disposable project first.
-- The admin form sends the display name only when this migration is applied, so the code can be deployed first.

alter table customer_orders
  add column honeycomb_name text
    check (honeycomb_name is null or char_length(honeycomb_name) between 1 and 30);

-- Shows or hides one order, and sets the name shown on its cell. A blank name clears the choice. When the payload has
-- no display_name key, the current name is kept.
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
     set show_on_honeycomb = (p->>'show')::boolean,
         honeycomb_name = case
           when p ? 'display_name' then nullif(trim(coalesce(p->>'display_name', '')), '')
           else honeycomb_name
         end,
         updated_at = now()
   where id = v_before.id
   returning * into v_after;

  insert into membership_audit_events (actor, action, entity_type, entity_id, reason, before_state, after_state)
  values (
    p->>'actor', 'order.honeycomb_changed', 'customer_order', v_after.id::text, v_reason,
    to_jsonb(v_before), to_jsonb(v_after)
  );

  return to_jsonb(v_after);
exception
  when check_violation then
    raise exception 'membership: invalid_honeycomb_name';
end;
$$;

-- The public honeycomb: agreed orders, oldest first, with the chosen name (if any) and the customer's name, which
-- the server formats before anything is shown. Nothing else about the customer is returned.
create or replace function customer_orders_honeycomb(p jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'customer_name', c.customer_name,
      'honeycomb_name', c.honeycomb_name,
      'created_at', c.created_at
    )
    order by c.created_at
  ), '[]'::jsonb)
  from (
    select o.id, o.customer_name, o.honeycomb_name, o.created_at
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
