-- Phase 6 audit fixes.

-- ---------------------------------------------------------------------------------------------
-- 1. Staff can only change the order and customer fields the admin edits directly. Status,
--    payment, totals and stock go through the order_* functions (security definer), so a staff
--    login can't PATCH an order to "paid" or rewrite its total through the API.
-- ---------------------------------------------------------------------------------------------
revoke update on public.orders from authenticated;
grant update (internal_notes, tags, courier, tracking_number) on public.orders to authenticated;

revoke update on public.customers from authenticated;
grant update (name, phone, email, whatsapp_opt_in, city, default_address, notes)
  on public.customers to authenticated;

-- Timeline entries written from the admin are notes and "WhatsApp opened" lines, signed by the
-- person writing them. System entries (status, payment) only come from the database functions.
drop policy if exists order_events_insert on public.order_events;
create policy order_events_insert on public.order_events for insert to authenticated
  with check (public.is_staff() and type in ('note', 'message') and actor_id = auth.uid());

-- Stock movements are written by the admin_* functions; a direct insert must be signed.
drop policy if exists stock_insert on public.stock_movements;
create policy stock_insert on public.stock_movements for insert to authenticated
  with check (public.has_role('{owner,manager}') and actor_id = auth.uid());

-- ---------------------------------------------------------------------------------------------
-- 2. create_order
--    - Repeated lines for the same size are merged before the stock check (two lines of 1 unit
--      each could pass when only 1 was available).
--    - Sizes are locked in id order, so two checkouts can't deadlock.
--    - An online order no longer overwrites a returning customer's saved name and address (anyone
--      who knows a phone number could change them); it only fills in what is missing.
--    - At most 5 open online orders per phone number in 24 hours (stops a script from reserving
--      all the stock with fake cash-on-delivery orders).
-- ---------------------------------------------------------------------------------------------
create or replace function public.create_order(p jsonb)
returns table (order_id uuid, order_number text, access_token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_line record;
  v_variant public.product_variants%rowtype;
  v_product public.products%rowtype;
  v_customer_id uuid;
  v_order public.orders%rowtype;
  v_subtotal integer := 0;
  v_source text := coalesce(p ->> 'source', 'online');
  v_actor uuid := nullif(p ->> 'actor_id', '')::uuid;
  v_actor_name text;
  v_first text;
  v_lines jsonb;
begin
  if jsonb_array_length(coalesce(p -> 'lines', '[]')) = 0 then
    raise exception 'ORDER_EMPTY';
  end if;
  if exists (select 1 from jsonb_array_elements(p -> 'lines') l
             where coalesce((l ->> 'quantity')::integer, 0) <= 0) then
    raise exception 'BAD_QUANTITY';
  end if;

  -- One line per size, in id order.
  select jsonb_agg(jsonb_build_object('variant_id', vid, 'quantity', qty, 'unit_price', price)
                   order by vid)
    into v_lines
    from (
      select l ->> 'variant_id' as vid, sum((l ->> 'quantity')::integer)::integer as qty,
             max((l ->> 'unit_price')::integer) as price
      from jsonb_array_elements(p -> 'lines') l group by l ->> 'variant_id'
    ) g;
  if exists (
    select 1 from (
      select l ->> 'variant_id' as vid from jsonb_array_elements(p -> 'lines') l
      group by l ->> 'variant_id'
      having min((l ->> 'unit_price')::integer) <> max((l ->> 'unit_price')::integer)
    ) x
  ) then
    raise exception 'PRICE_CHANGED:%', 'mixed';
  end if;

  if v_source = 'online' and (
    select count(*) from public.orders
    where phone = p ->> 'phone' and source = 'online' and fulfilment_status = 'pending'
      and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'TOO_MANY_ORDERS';
  end if;

  -- Lock and validate every size first.
  for v_line in
    select x ->> 'variant_id' as vid, (x ->> 'quantity')::integer as qty,
           (x ->> 'unit_price')::integer as price
    from jsonb_array_elements(v_lines) x
  loop
    select * into v_variant from public.product_variants where id = v_line.vid for update;
    if not found then raise exception 'VARIANT_NOT_FOUND:%', v_line.vid; end if;
    select * into v_product from public.products where id = v_variant.product_id;
    if v_product.status <> 'active' or v_product.purchase_mode <> 'retail' then
      raise exception 'VARIANT_UNAVAILABLE:%', v_variant.id;
    end if;
    if v_variant.price <> v_line.price then
      raise exception 'PRICE_CHANGED:%', v_variant.id;
    end if;
    if v_variant.stock - v_variant.reserved < v_line.qty then
      raise exception 'OUT_OF_STOCK:%', v_variant.id;
    end if;
    v_subtotal := v_subtotal + v_variant.price * v_line.qty;
  end loop;

  if v_subtotal <> (p ->> 'subtotal')::integer then
    raise exception 'TOTAL_MISMATCH';
  end if;

  if v_source = 'admin' then
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
  else
    insert into public.customers (name, email, phone, whatsapp_opt_in, city, default_address)
    values (
      p -> 'shipping_address' ->> 'fullName', nullif(p ->> 'email', ''), p ->> 'phone',
      coalesce((p ->> 'whatsapp_updates')::boolean, false),
      p -> 'shipping_address' ->> 'city', p -> 'shipping_address'
    )
    on conflict (phone) do update set
      name = coalesce(nullif(public.customers.name, ''), excluded.name),
      email = coalesce(public.customers.email, excluded.email),
      whatsapp_opt_in = public.customers.whatsapp_opt_in or excluded.whatsapp_opt_in,
      city = coalesce(nullif(public.customers.city, ''), excluded.city),
      default_address = coalesce(public.customers.default_address, excluded.default_address)
    returning id into v_customer_id;
  end if;

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

  for v_line in
    select x ->> 'variant_id' as vid, (x ->> 'quantity')::integer as qty
    from jsonb_array_elements(v_lines) x
  loop
    select * into v_variant from public.product_variants where id = v_line.vid;
    select * into v_product from public.products where id = v_variant.product_id;
    insert into public.order_lines (
      order_id, product_id, variant_id, sku, name, variant_label, image,
      unit_price, quantity, line_total, unit_cost
    ) values (
      v_order.id, v_product.id, v_variant.id, v_variant.sku, v_product.name, v_variant.label,
      v_product.images -> 0 ->> 'src', v_variant.price, v_line.qty,
      v_variant.price * v_line.qty, v_variant.unit_cost
    );
    update public.product_variants set reserved = reserved + v_line.qty where id = v_variant.id;
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
-- 3. admin_save_product: each size can carry `expected_stock` (the count the editor loaded).
--    If the stock field wasn't changed, the live count is kept; if it was changed but the live
--    count moved in the meantime (an order shipped, a purchase arrived), the save is refused.
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_save_product(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id text := coalesce(nullif(p ->> 'id', ''), gen_random_uuid()::text);
  v_var jsonb;
  v_vid text;
  v_old public.product_variants%rowtype;
  v_stock integer;
  v_expected integer;
  v_keep text[] := '{}';
  v_idx integer := 0;
  v_actor uuid := auth.uid();
begin
  if not public.has_role('{owner,manager}') then raise exception 'NOT_ALLOWED'; end if;
  if exists (select 1 from public.products where slug = p ->> 'slug' and id <> v_id) then
    raise exception 'SLUG_TAKEN';
  end if;

  insert into public.products as t (
    id, slug, status, name, short_name, tagline, description, botanical_name, origin, category_id,
    images, purchase_mode, badge, highlights, ways_to_enjoy, how_to_use, attributes,
    is_featured, is_best_seller, is_new_arrival, popularity_rank, related_product_ids, vendor, tags, seo
  ) values (
    v_id, p ->> 'slug', (p ->> 'status')::public.publish_status, p ->> 'name',
    nullif(p ->> 'short_name', ''), coalesce(p ->> 'tagline', ''),
    array(select jsonb_array_elements_text(coalesce(p -> 'description', '[]'))),
    nullif(p ->> 'botanical_name', ''), coalesce(p ->> 'origin', ''), p ->> 'category_id',
    coalesce(p -> 'images', '[]'), coalesce((p ->> 'purchase_mode')::public.purchase_mode, 'retail'),
    case when jsonb_typeof(p -> 'badge') = 'object' then p -> 'badge' end,
    array(select jsonb_array_elements_text(coalesce(p -> 'highlights', '[]'))),
    array(select jsonb_array_elements_text(coalesce(p -> 'ways_to_enjoy', '[]'))),
    coalesce(p -> 'how_to_use', '[]'), coalesce(p -> 'attributes', '[]'),
    coalesce((p ->> 'is_featured')::boolean, false), coalesce((p ->> 'is_best_seller')::boolean, false),
    coalesce((p ->> 'is_new_arrival')::boolean, false), coalesce((p ->> 'popularity_rank')::integer, 999),
    array(select jsonb_array_elements_text(coalesce(p -> 'related_product_ids', '[]'))),
    coalesce(nullif(p ->> 'vendor', ''), 'North Nectar'),
    array(select jsonb_array_elements_text(coalesce(p -> 'tags', '[]'))),
    case when jsonb_typeof(p -> 'seo') = 'object' then p -> 'seo' end
  )
  on conflict (id) do update set
    slug = excluded.slug, status = excluded.status, name = excluded.name,
    short_name = excluded.short_name, tagline = excluded.tagline, description = excluded.description,
    botanical_name = excluded.botanical_name, origin = excluded.origin, category_id = excluded.category_id,
    images = excluded.images, purchase_mode = excluded.purchase_mode, badge = excluded.badge,
    highlights = excluded.highlights, ways_to_enjoy = excluded.ways_to_enjoy,
    how_to_use = excluded.how_to_use, attributes = excluded.attributes,
    is_featured = excluded.is_featured, is_best_seller = excluded.is_best_seller,
    is_new_arrival = excluded.is_new_arrival, popularity_rank = excluded.popularity_rank,
    related_product_ids = excluded.related_product_ids, vendor = excluded.vendor,
    tags = excluded.tags, seo = excluded.seo, updated_at = now();

  for v_var in select * from jsonb_array_elements(coalesce(p -> 'variants', '[]')) loop
    v_idx := v_idx + 1;
    v_vid := nullif(v_var ->> 'id', '');
    v_stock := greatest(coalesce((v_var ->> 'stock')::integer, 0), 0);
    v_expected := nullif(v_var ->> 'expected_stock', '')::integer;
    if exists (select 1 from public.product_variants
               where sku = v_var ->> 'sku' and id is distinct from v_vid) then
      raise exception 'SKU_TAKEN:%', v_var ->> 'sku';
    end if;

    select * into v_old from public.product_variants
      where id = v_vid and product_id = v_id for update;
    if found then
      if v_expected is not null then
        if v_stock = v_expected then
          v_stock := v_old.stock; -- stock not edited: keep the live count
        elsif v_old.stock <> v_expected then
          raise exception 'STOCK_CHANGED:%', v_var ->> 'sku';
        end if;
      end if;
      if v_stock < v_old.reserved then
        raise exception 'STOCK_BELOW_RESERVED:%:%', v_var ->> 'sku', v_old.reserved;
      end if;
      update public.product_variants set
        label = v_var ->> 'label', sku = v_var ->> 'sku', price = (v_var ->> 'price')::integer,
        compare_at_price = nullif(v_var ->> 'compare_at_price', '')::integer, stock = v_stock,
        weight_grams = nullif(v_var ->> 'weight_grams', '')::integer,
        shipping_weight_grams = nullif(v_var ->> 'shipping_weight_grams', '')::integer,
        tag = nullif(v_var ->> 'tag', ''), is_default = coalesce((v_var ->> 'is_default')::boolean, false),
        sort_order = v_idx
      where id = v_old.id;
      if v_stock <> v_old.stock then
        insert into public.stock_movements
          (variant_id, type, quantity, balance_after, unit_cost, reference, reason, actor_id)
        values (v_old.id, 'adjustment', v_stock - v_old.stock, v_stock, v_old.unit_cost,
          'Product editor', 'Stock changed in the product editor', v_actor);
      end if;
      v_vid := v_old.id;
    else
      insert into public.product_variants (
        product_id, label, sku, price, compare_at_price, stock, weight_grams,
        shipping_weight_grams, tag, is_default, sort_order
      ) values (
        v_id, v_var ->> 'label', v_var ->> 'sku', (v_var ->> 'price')::integer,
        nullif(v_var ->> 'compare_at_price', '')::integer, v_stock,
        nullif(v_var ->> 'weight_grams', '')::integer, nullif(v_var ->> 'shipping_weight_grams', '')::integer,
        nullif(v_var ->> 'tag', ''), coalesce((v_var ->> 'is_default')::boolean, false), v_idx
      ) returning id into v_vid;
      if v_stock > 0 then
        insert into public.stock_movements
          (variant_id, type, quantity, balance_after, reference, reason, actor_id)
        values (v_vid, 'adjustment', v_stock, v_stock, 'Product editor', 'Opening stock', v_actor);
      end if;
    end if;
    v_keep := v_keep || v_vid;
  end loop;

  if exists (select 1 from public.product_variants
             where product_id = v_id and not (id = any (v_keep)) and reserved > 0) then
    raise exception 'SIZE_IN_OPEN_ORDERS';
  end if;
  delete from public.product_variants where product_id = v_id and not (id = any (v_keep));

  return v_id;
end $$;
revoke all on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 4. Shipping rates are saved in one transaction (no moment with no "everywhere else" zone, and
--    nothing half-saved if a step fails). Returns the zone ids in the order given.
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_save_shipping(p_zones jsonb, p_express jsonb)
returns uuid[]
language plpgsql security definer set search_path = public as $$
declare
  z jsonb;
  v_idx integer := 0;
  v_id uuid;
  v_ids uuid[] := '{}';
  v_keep uuid[];
  v_fallback boolean;
begin
  if not public.has_role('{owner}') then raise exception 'NOT_ALLOWED'; end if;
  if jsonb_array_length(coalesce(p_zones, '[]')) = 0 then raise exception 'NO_ZONES'; end if;
  if (select count(*) from jsonb_array_elements(p_zones) e
      where coalesce((e ->> 'is_fallback')::boolean, false)) <> 1 then
    raise exception 'ONE_FALLBACK';
  end if;

  v_keep := array(
    select (e ->> 'id')::uuid from jsonb_array_elements(p_zones) e
    where e ->> 'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
  delete from public.shipping_zones where not (id = any (v_keep));
  update public.shipping_zones set is_fallback = false where is_fallback;

  for z in select * from jsonb_array_elements(p_zones) loop
    v_idx := v_idx + 1;
    v_fallback := coalesce((z ->> 'is_fallback')::boolean, false);
    v_id := case when z ->> 'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                 then (z ->> 'id')::uuid end;
    if v_id is not null and exists (select 1 from public.shipping_zones where id = v_id) then
      update public.shipping_zones set
        name = z ->> 'name',
        cities = case when v_fallback then '{}' else array(select jsonb_array_elements_text(coalesce(z -> 'cities', '[]'))) end,
        provinces = case when v_fallback then '{}' else array(select jsonb_array_elements_text(coalesce(z -> 'provinces', '[]'))) end,
        is_fallback = v_fallback,
        rate = (z ->> 'rate')::integer,
        free_over = nullif(z ->> 'free_over', '')::integer,
        days_min = (z ->> 'days_min')::integer,
        days_max = (z ->> 'days_max')::integer,
        courier = coalesce(z ->> 'courier', ''),
        sort_order = v_idx
      where id = v_id;
    else
      insert into public.shipping_zones
        (name, cities, provinces, is_fallback, rate, free_over, days_min, days_max, courier, sort_order)
      values (
        z ->> 'name',
        case when v_fallback then '{}' else array(select jsonb_array_elements_text(coalesce(z -> 'cities', '[]'))) end,
        case when v_fallback then '{}' else array(select jsonb_array_elements_text(coalesce(z -> 'provinces', '[]'))) end,
        v_fallback, (z ->> 'rate')::integer, nullif(z ->> 'free_over', '')::integer,
        (z ->> 'days_min')::integer, (z ->> 'days_max')::integer, coalesce(z ->> 'courier', ''), v_idx
      ) returning id into v_id;
    end if;
    v_ids := v_ids || v_id;
  end loop;

  update public.store_settings set express = p_express where id;
  return v_ids;
end $$;
revoke all on function public.admin_save_shipping(jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_shipping(jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 5. Undoing an import writes reversing ledger entries instead of deleting the originals, so the
--    running balances in Stock movements still add up.
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_undo_import(p_import uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_import public.imports%rowtype;
  m record;
  v_stock integer;
  v_reserved integer;
  v_cost integer;
  v_variants text[];
begin
  if not public.has_role('{owner,manager}') then raise exception 'NOT_ALLOWED'; end if;
  select * into v_import from public.imports where id = p_import for update;
  if not found then raise exception 'IMPORT_NOT_FOUND'; end if;
  if v_import.status = 'undone' then return; end if;
  if v_import.kind = 'products' then raise exception 'CANNOT_UNDO_PRODUCTS'; end if;

  select array_agg(distinct variant_id) into v_variants from public.stock_movements where import_id = p_import;

  for m in select variant_id, sum(quantity)::integer as qty from public.stock_movements
           where import_id = p_import group by variant_id order by variant_id loop
    select stock, reserved, unit_cost into v_stock, v_reserved, v_cost from public.product_variants
      where id = m.variant_id for update;
    if v_stock - m.qty < v_reserved or v_stock - m.qty < 0 then
      raise exception 'STOCK_ALREADY_USED:%', m.variant_id;
    end if;
    if m.qty <> 0 then
      update public.product_variants set stock = stock - m.qty where id = m.variant_id;
      insert into public.stock_movements
        (variant_id, type, quantity, balance_after, unit_cost, reference, reason, actor_id, import_id)
      values (m.variant_id, 'adjustment', -m.qty, v_stock - m.qty, v_cost, 'Import undone',
        'Reverses an undone import', auth.uid(), p_import);
    end if;
  end loop;

  delete from public.purchases where import_id = p_import;

  if v_import.kind = 'purchases' and v_variants is not null then
    update public.product_variants v set unit_cost = coalesce((
      select l.unit_cost from public.purchase_lines l join public.purchases p on p.id = l.purchase_id
      where l.variant_id = v.id order by p.purchase_date desc, p.created_at desc limit 1
    ), (
      select s.unit_cost from public.stock_movements s
      where s.variant_id = v.id and s.unit_cost is not null
        and s.import_id is distinct from p_import
      order by s.created_at desc limit 1
    ), v.unit_cost)
    where v.id = any (v_variants);
  end if;

  update public.imports set status = 'undone', undone_at = now() where id = p_import;
end $$;
revoke all on function public.admin_undo_import(uuid) from public, anon;
grant execute on function public.admin_undo_import(uuid) to authenticated;
