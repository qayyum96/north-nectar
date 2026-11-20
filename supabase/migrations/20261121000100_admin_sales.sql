-- Phase 2 of the admin: orders, customers and messages.
--
-- * order_events get a second line (detail) for the order timeline.
-- * contact_messages get read_at, so "unread" and "resolved" are separate.
-- * Order status and payment changes go through two functions that check the transition, move
--   stock and write the timeline in one transaction:
--     pending   -> confirmed | cancelled
--     confirmed -> pending (undo) | shipped | cancelled
--     shipped   -> delivered | returned
--     delivered -> returned
--   Placing an order reserves units, shipping removes them from stock, cancelling releases them
--   and a return can put them back.
-- * customer_summaries: one row per customer with order count, spend and last order.

alter table public.order_events add column if not exists detail text;
alter table public.contact_messages add column if not exists read_at timestamptz;
create index if not exists contact_messages_unread_idx on public.contact_messages (created_at desc)
  where read_at is null;

-- Name of the signed-in staff member ("Qayyum"), for timeline entries.
create or replace function public.current_staff_name()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(split_part(name, ' ', 1), ''), split_part(email, '@', 1))
  from public.staff where user_id = auth.uid()
$$;
revoke all on function public.current_staff_name() from public, anon;
grant execute on function public.current_staff_name() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- create_order: timeline wording, admin-created orders and an optional starting payment status.
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_order(p jsonb)
returns table (order_id uuid, order_number text, access_token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_line jsonb;
  v_variant public.product_variants%rowtype;
  v_product public.products%rowtype;
  v_customer_id uuid;
  v_order public.orders%rowtype;
  v_subtotal integer := 0;
  v_source text := coalesce(p ->> 'source', 'online');
  v_actor uuid := nullif(p ->> 'actor_id', '')::uuid;
  v_actor_name text;
  v_first text;
begin
  if jsonb_array_length(coalesce(p -> 'lines', '[]')) = 0 then
    raise exception 'ORDER_EMPTY';
  end if;

  -- Lock and validate every line first.
  for v_line in select * from jsonb_array_elements(p -> 'lines') loop
    select * into v_variant from public.product_variants
      where id = v_line ->> 'variant_id' for update;
    if not found then raise exception 'VARIANT_NOT_FOUND:%', v_line ->> 'variant_id'; end if;
    select * into v_product from public.products where id = v_variant.product_id;
    if v_product.status <> 'active' or v_product.purchase_mode <> 'retail' then
      raise exception 'VARIANT_UNAVAILABLE:%', v_variant.id;
    end if;
    if v_variant.price <> (v_line ->> 'unit_price')::integer then
      raise exception 'PRICE_CHANGED:%', v_variant.id;
    end if;
    if v_variant.stock - v_variant.reserved < (v_line ->> 'quantity')::integer then
      raise exception 'OUT_OF_STOCK:%', v_variant.id;
    end if;
    v_subtotal := v_subtotal + v_variant.price * (v_line ->> 'quantity')::integer;
  end loop;

  if v_subtotal <> (p ->> 'subtotal')::integer then
    raise exception 'TOTAL_MISMATCH';
  end if;

  insert into public.customers (name, email, phone, whatsapp_opt_in, city, default_address)
  values (
    p -> 'shipping_address' ->> 'fullName', nullif(p ->> 'email', ''), p ->> 'phone',
    coalesce((p ->> 'whatsapp_updates')::boolean, false),
    p -> 'shipping_address' ->> 'city', p -> 'shipping_address'
  )
  on conflict (phone) do update set
    name = excluded.name,
    email = coalesce(excluded.email, public.customers.email),
    whatsapp_opt_in = excluded.whatsapp_opt_in,
    city = excluded.city,
    default_address = excluded.default_address
  returning id into v_customer_id;

  insert into public.orders (
    source, customer_id, email, phone, whatsapp_updates, shipping_address,
    delivery_method_id, delivery_label, payment_method_id, payment_label, payment_details,
    payment_status, subtotal, discount, delivery_fee, payment_fee, total, discount_code,
    internal_notes
  ) values (
    v_source, v_customer_id, nullif(p ->> 'email', ''), p ->> 'phone',
    coalesce((p ->> 'whatsapp_updates')::boolean, false), p -> 'shipping_address',
    p ->> 'delivery_method_id', p ->> 'delivery_label', p ->> 'payment_method_id',
    p ->> 'payment_label', p -> 'payment_details',
    coalesce((p ->> 'payment_status')::public.payment_status, 'unpaid'),
    v_subtotal, coalesce((p ->> 'discount')::integer, 0), coalesce((p ->> 'delivery_fee')::integer, 0),
    coalesce((p ->> 'payment_fee')::integer, 0), (p ->> 'total')::integer, nullif(p ->> 'discount_code', ''),
    coalesce(p ->> 'internal_notes', '')
  ) returning * into v_order;

  for v_line in select * from jsonb_array_elements(p -> 'lines') loop
    select * into v_variant from public.product_variants where id = v_line ->> 'variant_id';
    select * into v_product from public.products where id = v_variant.product_id;
    insert into public.order_lines (
      order_id, product_id, variant_id, sku, name, variant_label, image,
      unit_price, quantity, line_total, unit_cost
    ) values (
      v_order.id, v_product.id, v_variant.id, v_variant.sku, v_product.name, v_variant.label,
      v_product.images -> 0 ->> 'src', v_variant.price, (v_line ->> 'quantity')::integer,
      v_variant.price * (v_line ->> 'quantity')::integer, v_variant.unit_cost
    );
    update public.product_variants
      set reserved = reserved + (v_line ->> 'quantity')::integer
      where id = v_variant.id;
  end loop;

  v_first := split_part(coalesce(p -> 'shipping_address' ->> 'fullName', 'The customer'), ' ', 1);
  if v_source = 'admin' then
    select coalesce(nullif(split_part(name, ' ', 1), ''), split_part(email, '@', 1))
      into v_actor_name from public.staff where user_id = v_actor;
    insert into public.order_events (order_id, type, message, detail, actor_id)
    values (v_order.id, 'system', 'Order created',
      'Created in the admin by ' || coalesce(v_actor_name, 'a team member'), v_actor);
  else
    insert into public.order_events (order_id, type, message, detail)
    values (v_order.id, 'system', 'Order placed', v_first || ' placed this order on the online store');
  end if;

  return query select v_order.id, v_order.number, v_order.access_token;
end $$;
revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;

-- ---------------------------------------------------------------------------------------------
-- Fulfilment changes
-- ---------------------------------------------------------------------------------------------
create or replace function public.order_update_status(
  p_order uuid,
  p_to public.fulfilment_status,
  p_reason text default null,
  p_courier text default null,
  p_tracking text default null,
  p_restock boolean default true,
  p_refund boolean default false
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_line record;
  v_units integer;
  v_balance integer;
  v_actor uuid := auth.uid();
  v_name text := coalesce(public.current_staff_name(), 'the team');
  v_title text;
  v_detail text;
begin
  if not public.is_staff() then raise exception 'NOT_ALLOWED'; end if;

  select * into v_order from public.orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.fulfilment_status = p_to then return; end if;

  if not (
    (v_order.fulfilment_status = 'pending' and p_to in ('confirmed', 'cancelled')) or
    (v_order.fulfilment_status = 'confirmed' and p_to in ('pending', 'shipped', 'cancelled')) or
    (v_order.fulfilment_status = 'shipped' and p_to in ('delivered', 'returned')) or
    (v_order.fulfilment_status = 'delivered' and p_to = 'returned')
  ) then
    raise exception 'BAD_TRANSITION:%:%', v_order.fulfilment_status, p_to;
  end if;

  select coalesce(sum(quantity), 0) into v_units from public.order_lines where order_id = p_order;

  if p_to = 'confirmed' then
    update public.orders set fulfilment_status = 'confirmed', confirmed_at = now() where id = p_order;
    v_title := 'Order confirmed by ' || v_name;
    v_detail := v_units || case when v_units = 1 then ' unit' else ' units' end || ' reserved from stock';

  elsif p_to = 'pending' then
    update public.orders set fulfilment_status = 'pending', confirmed_at = null where id = p_order;
    v_title := 'Confirmation undone by ' || v_name;

  elsif p_to = 'cancelled' then
    -- Not shipped yet, so the units were only reserved.
    for v_line in select variant_id, quantity from public.order_lines
      where order_id = p_order and variant_id is not null loop
      update public.product_variants set reserved = greatest(reserved - v_line.quantity, 0)
        where id = v_line.variant_id;
    end loop;
    update public.orders set fulfilment_status = 'cancelled', cancelled_at = now(),
      cancel_reason = nullif(p_reason, '') where id = p_order;
    v_title := 'Order cancelled by ' || v_name;
    v_detail := concat_ws(' · ', nullif(p_reason, ''),
      v_units || case when v_units = 1 then ' unit' else ' units' end || ' back in stock');

  elsif p_to = 'shipped' then
    for v_line in select l.variant_id, l.quantity, l.unit_cost from public.order_lines l
      where l.order_id = p_order and l.variant_id is not null loop
      update public.product_variants
        set stock = greatest(stock - v_line.quantity, 0),
            reserved = greatest(reserved - v_line.quantity, 0)
        where id = v_line.variant_id
        returning stock into v_balance;
      insert into public.stock_movements
        (variant_id, type, quantity, balance_after, unit_cost, reference, reason, actor_id)
      values (v_line.variant_id, 'sale', -v_line.quantity, v_balance, v_line.unit_cost,
        '#' || v_order.number, 'Order shipped', v_actor);
    end loop;
    update public.orders set fulfilment_status = 'shipped', shipped_at = now(),
      courier = coalesce(nullif(p_courier, ''), courier),
      tracking_number = coalesce(nullif(p_tracking, ''), tracking_number)
      where id = p_order returning * into v_order;
    v_title := case when v_order.courier is not null
      then 'Shipped with ' || v_order.courier else 'Marked as shipped by ' || v_name end;
    v_detail := case when v_order.tracking_number is not null
      then 'Tracking ' || v_order.tracking_number else 'No tracking number' end;

  elsif p_to = 'delivered' then
    update public.orders set fulfilment_status = 'delivered', delivered_at = now() where id = p_order;
    v_title := 'Marked as delivered by ' || v_name;

  elsif p_to = 'returned' then
    if p_restock then
      for v_line in select l.variant_id, l.quantity, l.unit_cost from public.order_lines l
        where l.order_id = p_order and l.variant_id is not null loop
        update public.product_variants set stock = stock + v_line.quantity
          where id = v_line.variant_id returning stock into v_balance;
        insert into public.stock_movements
          (variant_id, type, quantity, balance_after, unit_cost, reference, reason, actor_id)
        values (v_line.variant_id, 'return', v_line.quantity, v_balance, v_line.unit_cost,
          '#' || v_order.number, coalesce(nullif(p_reason, ''), 'Order returned'), v_actor);
      end loop;
    end if;
    update public.orders set fulfilment_status = 'returned',
      cancel_reason = coalesce(nullif(p_reason, ''), cancel_reason),
      payment_status = case when p_refund and payment_status = 'paid' then 'refunded' else payment_status end
      where id = p_order;
    v_title := 'Marked as returned by ' || v_name;
    v_detail := concat_ws(' · ', nullif(p_reason, ''),
      case when p_restock
        then v_units || case when v_units = 1 then ' unit' else ' units' end || ' back in stock'
        else 'Not put back in stock' end,
      case when p_refund and v_order.payment_status = 'paid' then 'Payment refunded' end);
  end if;

  insert into public.order_events (order_id, type, message, detail, actor_id)
  values (p_order, 'status', v_title, v_detail, v_actor);
end $$;

create or replace function public.order_set_payment(p_order uuid, p_status public.payment_status)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_name text := coalesce(public.current_staff_name(), 'the team');
begin
  if not public.is_staff() then raise exception 'NOT_ALLOWED'; end if;
  select * into v_order from public.orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.payment_status = p_status then return; end if;

  update public.orders set payment_status = p_status where id = p_order;
  insert into public.order_events (order_id, type, message, detail, actor_id)
  values (p_order, 'payment',
    case p_status when 'paid' then 'Marked as paid' when 'refunded' then 'Marked as refunded'
      else 'Marked as unpaid' end,
    case p_status
      when 'paid' then 'Rs ' || to_char(v_order.total, 'FM999,999,999') || ' received · by ' || v_name
      else 'By ' || v_name end,
    auth.uid());
end $$;

revoke all on function public.order_update_status(uuid, public.fulfilment_status, text, text, text, boolean, boolean) from public, anon;
revoke all on function public.order_set_payment(uuid, public.payment_status) from public, anon;
grant execute on function public.order_update_status(uuid, public.fulfilment_status, text, text, text, boolean, boolean) to authenticated, service_role;
grant execute on function public.order_set_payment(uuid, public.payment_status) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Customer list figures. security_invoker: the view uses the caller's row level security.
-- ---------------------------------------------------------------------------------------------
create or replace view public.customer_summaries with (security_invoker = true) as
select
  c.*,
  count(o.id) filter (where o.fulfilment_status <> 'cancelled')::integer as orders_count,
  count(o.id) filter (where o.fulfilment_status = 'pending')::integer as pending_count,
  coalesce(sum(o.total) filter (where o.fulfilment_status not in ('cancelled', 'returned')), 0)::integer
    as total_spent,
  max(o.created_at) as last_order_at,
  (array_agg(o.number order by o.created_at desc))[1] as last_order_number
from public.customers c
left join public.orders o on o.customer_id = c.id
group by c.id;

grant select on public.customer_summaries to authenticated, service_role;
