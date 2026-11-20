-- =============================================================================================
-- North Nectar core schema: catalogue, customers, orders, messages, newsletter, staff, stock.
--
-- Access model
--   anon (website visitors)  : SELECT active categories, products and sizes only.
--   authenticated (staff)    : per-role access through RLS (see "Row level security" below).
--   service_role (servers)   : full access; used only by Server Actions and admin server code.
-- Website writes (orders, messages, newsletter) go through server code with the secret key,
-- never from the browser.
-- =============================================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------
create type public.publish_status as enum ('active', 'draft');
create type public.purchase_mode as enum ('retail', 'quote');
create type public.staff_role as enum ('owner', 'manager', 'staff');
create type public.staff_status as enum ('active', 'invited', 'disabled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
create type public.fulfilment_status as enum (
  'pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'
);
create type public.message_status as enum ('open', 'resolved');
create type public.stock_movement_type as enum ('sale', 'purchase', 'adjustment', 'return');

-- ---------------------------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Staff (admin users). One row per Supabase Auth user who may use the admin.
-- ---------------------------------------------------------------------------------------------
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  role public.staff_role not null default 'staff',
  status public.staff_status not null default 'active',
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger staff_touch before update on public.staff
  for each row execute function public.touch_updated_at();

-- Role of the signed-in user, or null for visitors / non-staff. SECURITY DEFINER so RLS
-- policies can call it without recursing into the staff table's own policies.
create or replace function public.current_staff_role()
returns public.staff_role
language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select public.current_staff_role() is not null
$$;

create or replace function public.has_role(roles public.staff_role[])
returns boolean language sql stable as $$
  select coalesce(public.current_staff_role() = any (roles), false)
$$;

-- ---------------------------------------------------------------------------------------------
-- Catalogue
-- Ids are text so the seeded ids (e.g. "prod-hunza-wild-thyme-tea", "var-tea-100g") keep
-- working in carts and links; new rows get a random UUID string.
-- ---------------------------------------------------------------------------------------------
create table public.categories (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  image jsonb,
  sort_order integer not null default 0,
  status public.publish_status not null default 'draft',
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

create table public.products (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.publish_status not null default 'draft',
  name text not null,
  short_name text,
  tagline text not null default '',
  description text[] not null default '{}',
  botanical_name text,
  origin text not null default '',
  category_id text not null references public.categories (id),
  images jsonb not null default '[]',
  illustration jsonb,
  purchase_mode public.purchase_mode not null default 'retail',
  badge jsonb,
  highlights text[] not null default '{}',
  ways_to_enjoy text[] not null default '{}',
  how_to_use jsonb not null default '[]',
  attributes jsonb not null default '[]',
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new_arrival boolean not null default false,
  popularity_rank integer not null default 999,
  related_product_ids text[] not null default '{}',
  vendor text not null default 'North Nectar',
  tags text[] not null default '{}',
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_variants (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references public.products (id) on delete cascade,
  sku text not null unique,
  label text not null,
  weight_grams integer,
  shipping_weight_grams integer,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  -- Units physically on hand.
  stock integer not null default 0 check (stock >= 0),
  -- Units held by open orders (placed, not yet shipped or cancelled). Available = stock - reserved.
  reserved integer not null default 0 check (reserved >= 0),
  reorder_at integer not null default 0,
  -- Latest purchase cost per unit (PKR), used for stock value and profit.
  unit_cost integer,
  tag text,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id);
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Customers (guest checkout: identified by mobile number)
-- ---------------------------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text not null unique,
  whatsapp_opt_in boolean not null default false,
  city text,
  default_address jsonb,
  notes text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Shown as "#NN1001".
  number text not null unique default ('NN' || nextval('public.order_number_seq')),
  -- Lets the customer's browser load its own confirmation page without exposing other orders.
  access_token uuid not null default gen_random_uuid(),
  source text not null default 'online' check (source in ('online', 'admin')),
  customer_id uuid references public.customers (id),
  email text,
  phone text not null,
  whatsapp_updates boolean not null default false,
  shipping_address jsonb not null,
  delivery_method_id text not null,
  delivery_label text not null,
  payment_method_id text not null,
  payment_label text not null,
  payment_details jsonb,
  payment_status public.payment_status not null default 'unpaid',
  fulfilment_status public.fulfilment_status not null default 'pending',
  subtotal integer not null,
  discount integer not null default 0,
  delivery_fee integer not null default 0,
  payment_fee integer not null default 0,
  total integer not null,
  discount_code text,
  courier text,
  tracking_number text,
  tags text[] not null default '{}',
  internal_notes text not null default '',
  cancel_reason text,
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_customer_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (fulfilment_status);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  variant_id text references public.product_variants (id) on delete set null,
  sku text not null,
  name text not null,
  variant_label text not null,
  image text,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  line_total integer not null,
  -- Cost per unit at the time of sale, for profit reports.
  unit_cost integer
);
create index order_lines_order_idx on public.order_lines (order_id);
create index order_lines_variant_idx on public.order_lines (variant_id);

-- Order timeline: notes, status changes, messages sent.
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type text not null check (type in ('note', 'status', 'payment', 'message', 'system')),
  message text not null,
  actor_id uuid references public.staff (user_id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at desc);

-- ---------------------------------------------------------------------------------------------
-- Stock ledger: every unit in and out.
-- ---------------------------------------------------------------------------------------------
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id text not null references public.product_variants (id) on delete cascade,
  type public.stock_movement_type not null,
  -- Signed: positive adds stock, negative removes it.
  quantity integer not null check (quantity <> 0),
  balance_after integer not null,
  unit_cost integer,
  reference text,
  reason text,
  note text,
  actor_id uuid references public.staff (user_id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_movements_variant_idx on public.stock_movements (variant_id, created_at desc);
create index stock_movements_created_idx on public.stock_movements (created_at desc);

-- ---------------------------------------------------------------------------------------------
-- Website messages and newsletter
-- ---------------------------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status public.message_status not null default 'open',
  source text,
  related_order_id uuid references public.orders (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

create table public.newsletter_subscribers (
  email text primary key,
  source text,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================================
-- Functions used by the website (called with the secret key from Server Actions only)
-- =============================================================================================

-- Creates an order atomically: validates and reserves stock (row locks, so two customers can't
-- buy the last unit), upserts the customer by mobile number, writes lines and a timeline entry.
-- Prices and totals are computed by the caller from the data layer and passed in; the function
-- re-checks every line against current prices and fails if anything changed.
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
    subtotal, discount, delivery_fee, payment_fee, total, discount_code
  ) values (
    coalesce(p ->> 'source', 'online'), v_customer_id, nullif(p ->> 'email', ''), p ->> 'phone',
    coalesce((p ->> 'whatsapp_updates')::boolean, false), p -> 'shipping_address',
    p ->> 'delivery_method_id', p ->> 'delivery_label', p ->> 'payment_method_id',
    p ->> 'payment_label', p -> 'payment_details',
    v_subtotal, coalesce((p ->> 'discount')::integer, 0), coalesce((p ->> 'delivery_fee')::integer, 0),
    coalesce((p ->> 'payment_fee')::integer, 0), (p ->> 'total')::integer, nullif(p ->> 'discount_code', '')
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

  insert into public.order_events (order_id, type, message)
  values (v_order.id, 'system', 'Order placed on the website');

  return query select v_order.id, v_order.number, v_order.access_token;
end $$;

-- =============================================================================================
-- Privileges (new tables are not exposed automatically on this project)
-- =============================================================================================
grant usage on schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant all on all tables in schema public to service_role;

grant select on public.categories, public.products, public.product_variants to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
grant execute on function public.current_staff_role(), public.is_staff(),
  public.has_role(public.staff_role[]) to anon, authenticated, service_role;

-- =============================================================================================
-- Row level security
-- =============================================================================================
alter table public.staff enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.order_events enable row level security;
alter table public.stock_movements enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Staff: everyone sees their own row; owners see and manage the team.
create policy staff_select on public.staff for select to authenticated
  using (user_id = auth.uid() or public.has_role('{owner}'));
create policy staff_owner_write on public.staff for all to authenticated
  using (public.has_role('{owner}')) with check (public.has_role('{owner}'));

-- Catalogue: visitors read active items; staff read everything; owners and managers edit.
create policy categories_public on public.categories for select to anon
  using (status = 'active');
create policy categories_staff_read on public.categories for select to authenticated
  using (status = 'active' or public.is_staff());
create policy categories_edit on public.categories for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));

create policy products_public on public.products for select to anon
  using (status = 'active');
create policy products_staff_read on public.products for select to authenticated
  using (status = 'active' or public.is_staff());
create policy products_edit on public.products for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));

create policy variants_public on public.product_variants for select to anon
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy variants_staff_read on public.product_variants for select to authenticated
  using (public.is_staff()
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy variants_edit on public.product_variants for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));

-- Sales data: all staff read and update; only owners delete.
create policy customers_read on public.customers for select to authenticated using (public.is_staff());
create policy customers_insert on public.customers for insert to authenticated with check (public.is_staff());
create policy customers_update on public.customers for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy customers_delete on public.customers for delete to authenticated using (public.has_role('{owner}'));

create policy orders_read on public.orders for select to authenticated using (public.is_staff());
create policy orders_insert on public.orders for insert to authenticated with check (public.is_staff());
create policy orders_update on public.orders for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy orders_delete on public.orders for delete to authenticated using (public.has_role('{owner}'));

create policy order_lines_read on public.order_lines for select to authenticated using (public.is_staff());
create policy order_lines_write on public.order_lines for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));

create policy order_events_read on public.order_events for select to authenticated using (public.is_staff());
create policy order_events_insert on public.order_events for insert to authenticated
  with check (public.is_staff() and (actor_id is null or actor_id = auth.uid()));

-- Stock ledger: staff read; owners and managers record movements. Rows are never edited.
create policy stock_read on public.stock_movements for select to authenticated using (public.is_staff());
create policy stock_insert on public.stock_movements for insert to authenticated
  with check (public.has_role('{owner,manager}'));

-- Messages: all staff read and resolve. Newsletter: owners and managers.
create policy messages_read on public.contact_messages for select to authenticated using (public.is_staff());
create policy messages_update on public.contact_messages for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy newsletter_read on public.newsletter_subscribers for select to authenticated
  using (public.has_role('{owner,manager}'));
create policy newsletter_update on public.newsletter_subscribers for update to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));
