-- Phase 3 of the admin: products, categories and image upload.
--
-- * Storage bucket "catalog" (public read) for product and category images. Owners and managers
--   upload; files are resized to WebP in the browser first, so the free 1 GB lasts.
-- * admin_save_product(p): saves a product and all its sizes in one transaction. A changed stock
--   number is recorded as an "adjustment" stock movement, and sizes still held by open orders
--   cannot be removed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists catalog_staff_read on storage.objects;
drop policy if exists catalog_editors_insert on storage.objects;
drop policy if exists catalog_editors_update on storage.objects;
drop policy if exists catalog_editors_delete on storage.objects;

create policy catalog_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'catalog' and public.is_staff());
create policy catalog_editors_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog' and public.has_role('{owner,manager}'));
create policy catalog_editors_update on storage.objects for update to authenticated
  using (bucket_id = 'catalog' and public.has_role('{owner,manager}'))
  with check (bucket_id = 'catalog' and public.has_role('{owner,manager}'));
create policy catalog_editors_delete on storage.objects for delete to authenticated
  using (bucket_id = 'catalog' and public.has_role('{owner,manager}'));

create or replace function public.admin_save_product(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id text := coalesce(nullif(p ->> 'id', ''), gen_random_uuid()::text);
  v_var jsonb;
  v_vid text;
  v_old public.product_variants%rowtype;
  v_stock integer;
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
    tags = excluded.tags, seo = excluded.seo;

  for v_var in select * from jsonb_array_elements(coalesce(p -> 'variants', '[]')) loop
    v_idx := v_idx + 1;
    v_vid := nullif(v_var ->> 'id', '');
    v_stock := greatest(coalesce((v_var ->> 'stock')::integer, 0), 0);
    if exists (select 1 from public.product_variants
               where sku = v_var ->> 'sku' and id is distinct from v_vid) then
      raise exception 'SKU_TAKEN:%', v_var ->> 'sku';
    end if;

    select * into v_old from public.product_variants
      where id = v_vid and product_id = v_id for update;
    if found then
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
grant execute on function public.admin_save_product(jsonb) to authenticated, service_role;
