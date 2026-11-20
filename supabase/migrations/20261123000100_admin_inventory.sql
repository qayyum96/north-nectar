-- Phase 4 of the admin: stock, suppliers, purchases, stock movements and CSV/Excel import.
--
-- * suppliers, purchases (PO-0001...), purchase_lines (a size from the catalogue, or any other
--   item such as pouches and labels that isn't stocked), imports (history with undo).
-- * Recording a purchase adds the units to stock, logs "purchase" stock movements and updates each
--   size's unit cost (the latest purchase price), which feeds profit and stock value.
-- * Stock adjustments (ADJ-0001...) for damage, recounts, samples... A size can't go below the units
--   held by open orders.
-- * stock_movements get the sale price (filled in automatically for order movements), the purchase
--   and the import they came from (so an import can be undone).
-- * Bill photos and PDFs go to a PRIVATE storage bucket "bills" (owners and managers only).

create sequence if not exists public.purchase_number_seq start 1;
create sequence if not exists public.adjustment_number_seq start 1;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  supplies text not null default '',
  contact_name text,
  phone text,
  email text,
  city text,
  address text,
  payment_terms text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index suppliers_name_key on public.suppliers (lower(name));

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('products', 'purchases', 'movements')),
  file_name text not null,
  file_size integer not null default 0,
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  status text not null default 'completed'
    check (status in ('completed', 'completed_with_errors', 'failed', 'undone')),
  -- [{ "row": 4, "message": "Quantity must be a number" }]
  errors jsonb not null default '[]',
  summary text not null default '',
  actor_id uuid references public.staff (user_id) on delete set null,
  actor_name text,
  undone_at timestamptz,
  created_at timestamptz not null default now()
);
create index imports_created_idx on public.imports (created_at desc);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  number text not null unique
    default ('PO-' || lpad(nextval('public.purchase_number_seq')::text, 4, '0')),
  supplier_id uuid references public.suppliers (id) on delete set null,
  purchase_date date not null default (now() at time zone 'Asia/Karachi')::date,
  reference text,
  items_total integer not null default 0,
  delivery_cost integer not null default 0,
  total integer not null default 0,
  amount_paid integer not null default 0,
  paid_by text,
  notes text not null default '',
  bill_path text,
  bill_name text,
  bill_size integer,
  import_id uuid references public.imports (id) on delete set null,
  actor_id uuid references public.staff (user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_paid >= 0)
);
create index purchases_date_idx on public.purchases (purchase_date desc, created_at desc);
create index purchases_supplier_idx on public.purchases (supplier_id);

create table public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  variant_id text references public.product_variants (id) on delete set null,
  -- "Sea Buckthorn Berries · 250g", or a free item: "Kraft stand-up pouches".
  description text not null,
  detail text,
  quantity integer not null check (quantity > 0),
  unit_cost integer not null check (unit_cost >= 0),
  line_total integer not null,
  sort_order integer not null default 0
);
create index purchase_lines_purchase_idx on public.purchase_lines (purchase_id);
create index purchase_lines_variant_idx on public.purchase_lines (variant_id);

alter table public.stock_movements
  add column if not exists unit_price integer,
  add column if not exists purchase_id uuid references public.purchases (id) on delete set null,
  add column if not exists import_id uuid references public.imports (id) on delete set null;
create index if not exists stock_movements_import_idx on public.stock_movements (import_id);

-- Sale and return movements carry the order's selling price (for the movements ledger and profit).
create or replace function public.stock_movement_fill_price()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.unit_price is null and new.type in ('sale', 'return') and new.reference like '#%' then
    select l.unit_price into new.unit_price
      from public.order_lines l join public.orders o on o.id = l.order_id
      where o.number = substr(new.reference, 2) and l.variant_id = new.variant_id
      limit 1;
  end if;
  return new;
end $$;
drop trigger if exists stock_movements_fill_price on public.stock_movements;
create trigger stock_movements_fill_price before insert on public.stock_movements
  for each row execute function public.stock_movement_fill_price();

create trigger suppliers_touch before update on public.suppliers
  for each row execute function public.touch_updated_at();
create trigger purchases_touch before update on public.purchases
  for each row execute function public.touch_updated_at();

-- Row level security: owners and managers run purchasing; all staff can see stock movements.
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_lines enable row level security;
alter table public.imports enable row level security;

create policy suppliers_editors on public.suppliers for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));
create policy purchases_editors on public.purchases for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));
create policy purchase_lines_editors on public.purchase_lines for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));
create policy imports_read on public.imports for select to authenticated using (public.is_staff());
create policy imports_editors on public.imports for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));

grant select, insert, update, delete on public.suppliers, public.purchases, public.purchase_lines,
  public.imports to authenticated;
grant all on public.suppliers, public.purchases, public.purchase_lines, public.imports to service_role;
grant usage on sequence public.purchase_number_seq, public.adjustment_number_seq to authenticated, service_role;

-- Private bucket for supplier bills (photos and PDFs).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bills', 'bills', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists bills_editors_read on storage.objects;
drop policy if exists bills_editors_insert on storage.objects;
drop policy if exists bills_editors_delete on storage.objects;
create policy bills_editors_read on storage.objects for select to authenticated
  using (bucket_id = 'bills' and public.has_role('{owner,manager}'));
create policy bills_editors_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'bills' and public.has_role('{owner,manager}'));
create policy bills_editors_delete on storage.objects for delete to authenticated
  using (bucket_id = 'bills' and public.has_role('{owner,manager}'));

-- ---------------------------------------------------------------------------------------------
-- Summaries (security_invoker: the caller's row level security applies)
-- ---------------------------------------------------------------------------------------------
create or replace view public.supplier_summaries with (security_invoker = true) as
select
  s.*,
  count(p.id)::integer as purchases_count,
  coalesce(sum(p.total), 0)::integer as total_bought,
  coalesce(sum(greatest(p.total - p.amount_paid, 0)), 0)::integer as balance_due,
  min(p.purchase_date) as first_purchase_date,
  max(p.purchase_date) as last_purchase_date,
  (array_agg(p.number order by p.purchase_date desc, p.created_at desc))[1] as last_purchase_number
from public.suppliers s
left join public.purchases p on p.supplier_id = s.id
group by s.id;
grant select on public.supplier_summaries to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Record a purchase: p = { supplier_id, purchase_date, reference, delivery_cost, amount_paid,
--   paid_by, notes, bill_path, bill_name, bill_size, import_id,
--   lines: [{ variant_id | null, description, detail, quantity, unit_cost }] }
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_record_purchase(p jsonb)
returns table (purchase_id uuid, purchase_number text)
language plpgsql security definer set search_path = public as $$
declare
  v_purchase public.purchases%rowtype;
  v_line jsonb;
  v_items integer := 0;
  v_idx integer := 0;
  v_qty integer;
  v_cost integer;
  v_balance integer;
  v_desc text;
  v_actor uuid := auth.uid();
begin
  if not public.has_role('{owner,manager}') then raise exception 'NOT_ALLOWED'; end if;
  if jsonb_array_length(coalesce(p -> 'lines', '[]')) = 0 then raise exception 'NO_LINES'; end if;

  for v_line in select * from jsonb_array_elements(p -> 'lines') loop
    v_items := v_items + (v_line ->> 'quantity')::integer * (v_line ->> 'unit_cost')::integer;
  end loop;

  insert into public.purchases (
    supplier_id, purchase_date, reference, items_total, delivery_cost, total, amount_paid,
    paid_by, notes, bill_path, bill_name, bill_size, import_id, actor_id
  ) values (
    nullif(p ->> 'supplier_id', '')::uuid,
    coalesce(nullif(p ->> 'purchase_date', '')::date, (now() at time zone 'Asia/Karachi')::date),
    nullif(p ->> 'reference', ''), v_items, coalesce((p ->> 'delivery_cost')::integer, 0),
    v_items + coalesce((p ->> 'delivery_cost')::integer, 0),
    least(coalesce((p ->> 'amount_paid')::integer, 0), v_items + coalesce((p ->> 'delivery_cost')::integer, 0)),
    nullif(p ->> 'paid_by', ''), coalesce(p ->> 'notes', ''), nullif(p ->> 'bill_path', ''),
    nullif(p ->> 'bill_name', ''), nullif(p ->> 'bill_size', '')::integer,
    nullif(p ->> 'import_id', '')::uuid, v_actor
  ) returning * into v_purchase;

  for v_line in select * from jsonb_array_elements(p -> 'lines') loop
    v_idx := v_idx + 1;
    v_qty := (v_line ->> 'quantity')::integer;
    v_cost := (v_line ->> 'unit_cost')::integer;
    v_desc := v_line ->> 'description';
    if nullif(v_line ->> 'variant_id', '') is not null then
      select pr.name || ' · ' || v.label into v_desc
        from public.product_variants v join public.products pr on pr.id = v.product_id
        where v.id = v_line ->> 'variant_id';
      if v_desc is null then raise exception 'VARIANT_NOT_FOUND:%', v_line ->> 'variant_id'; end if;
      update public.product_variants set stock = stock + v_qty, unit_cost = v_cost
        where id = v_line ->> 'variant_id' returning stock into v_balance;
      insert into public.stock_movements
        (variant_id, type, quantity, balance_after, unit_cost, reference, reason, actor_id, purchase_id, import_id)
      values (v_line ->> 'variant_id', 'purchase', v_qty, v_balance, v_cost, v_purchase.number,
        'Purchase', v_actor, v_purchase.id, v_purchase.import_id);
    end if;
    insert into public.purchase_lines
      (purchase_id, variant_id, description, detail, quantity, unit_cost, line_total, sort_order)
    values (v_purchase.id, nullif(v_line ->> 'variant_id', ''), coalesce(v_desc, 'Item'),
      nullif(v_line ->> 'detail', ''), v_qty, v_cost, v_qty * v_cost, v_idx);
  end loop;

  return query select v_purchase.id, v_purchase.number;
end $$;

-- Add a payment to a purchase (never more than the total).
create or replace function public.admin_record_purchase_payment(p_purchase uuid, p_amount integer, p_paid_by text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('{owner,manager}') then raise exception 'NOT_ALLOWED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'BAD_AMOUNT'; end if;
  update public.purchases
    set amount_paid = least(total, amount_paid + p_amount),
        paid_by = coalesce(nullif(p_paid_by, ''), paid_by)
    where id = p_purchase;
  if not found then raise exception 'PURCHASE_NOT_FOUND'; end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Stock adjustment: mode add | remove | set. Also saves the low-stock level and unit cost.
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_adjust_stock(
  p_variant text,
  p_mode text,
  p_quantity integer,
  p_reason text,
  p_note text default null,
  p_reorder_at integer default null,
  p_unit_cost integer default null,
  p_import uuid default null
)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v public.product_variants%rowtype;
  v_new integer;
  v_ref text;
begin
  if not public.has_role('{owner,manager}') then raise exception 'NOT_ALLOWED'; end if;
  select * into v from public.product_variants where id = p_variant for update;
  if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
  v_new := case p_mode
    when 'add' then v.stock + greatest(p_quantity, 0)
    when 'remove' then v.stock - greatest(p_quantity, 0)
    when 'set' then greatest(p_quantity, 0)
    else null end;
  if v_new is null then raise exception 'BAD_MODE'; end if;
  if v_new < 0 then raise exception 'NOT_ENOUGH_STOCK:%', v.stock; end if;
  if v_new < v.reserved then raise exception 'BELOW_RESERVED:%', v.reserved; end if;

  update public.product_variants set
    stock = v_new,
    reorder_at = coalesce(p_reorder_at, reorder_at),
    unit_cost = case when p_unit_cost is null then unit_cost when p_unit_cost < 0 then null else p_unit_cost end
  where id = p_variant;

  if v_new <> v.stock then
    v_ref := 'ADJ-' || lpad(nextval('public.adjustment_number_seq')::text, 4, '0');
    insert into public.stock_movements
      (variant_id, type, quantity, balance_after, unit_cost, reference, reason, note, actor_id, import_id)
    values (p_variant, 'adjustment', v_new - v.stock, v_new,
      coalesce(case when p_unit_cost >= 0 then p_unit_cost end, v.unit_cost),
      v_ref, nullif(p_reason, ''), nullif(p_note, ''), auth.uid(), p_import);
  end if;
  return v_ref;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Undo an import: removes its purchases and reverses its stock movements, if stock allows.
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_undo_import(p_import uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_import public.imports%rowtype;
  m record;
  v_stock integer;
  v_reserved integer;
begin
  if not public.has_role('{owner,manager}') then raise exception 'NOT_ALLOWED'; end if;
  select * into v_import from public.imports where id = p_import for update;
  if not found then raise exception 'IMPORT_NOT_FOUND'; end if;
  if v_import.status = 'undone' then return; end if;
  if v_import.kind = 'products' then raise exception 'CANNOT_UNDO_PRODUCTS'; end if;

  for m in select variant_id, sum(quantity)::integer as qty from public.stock_movements
           where import_id = p_import group by variant_id loop
    select stock, reserved into v_stock, v_reserved from public.product_variants
      where id = m.variant_id for update;
    if v_stock - m.qty < v_reserved or v_stock - m.qty < 0 then
      raise exception 'STOCK_ALREADY_USED:%', m.variant_id;
    end if;
    update public.product_variants set stock = stock - m.qty where id = m.variant_id;
  end loop;

  delete from public.stock_movements where import_id = p_import;
  delete from public.purchases where import_id = p_import;
  update public.imports set status = 'undone', undone_at = now() where id = p_import;
end $$;

revoke all on function public.admin_record_purchase(jsonb) from public, anon;
revoke all on function public.admin_record_purchase_payment(uuid, integer, text) from public, anon;
revoke all on function public.admin_adjust_stock(text, text, integer, text, text, integer, integer, uuid) from public, anon;
revoke all on function public.admin_undo_import(uuid) from public, anon;
grant execute on function public.admin_record_purchase(jsonb) to authenticated, service_role;
grant execute on function public.admin_record_purchase_payment(uuid, integer, text) to authenticated, service_role;
grant execute on function public.admin_adjust_stock(text, text, integer, text, text, integer, integer, uuid) to authenticated, service_role;
grant execute on function public.admin_undo_import(uuid) to authenticated, service_role;
