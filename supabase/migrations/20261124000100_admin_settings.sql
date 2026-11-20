-- Phase 5 of the admin: store settings, payment methods and shipping rates by city/zone.
--
-- The website reads these at checkout (anon can SELECT; they hold nothing that isn't shown to
-- customers anyway, such as the bank account for transfers). Only the owner can change them.

create table public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'North Nectar',
  email text not null default 'info@northnectar.com',
  phone text not null default '0316 4354407',
  currency text not null default 'PKR',
  time_zone text not null default 'Asia/Karachi',
  date_format text not null default 'd MMM yyyy',
  address text not null default 'Kharfaq Village, Khaplu Road',
  city text not null default 'Khaplu',
  province text not null default 'Gilgit-Baltistan',
  postal_code text not null default '16800',
  -- { cod: {enabled}, bank_transfer: {enabled, bankName, accountTitle, iban},
  --   jazzcash: {enabled, number}, easypaisa: {enabled, number}, card: {enabled} }
  payments jsonb not null default '{
    "cod": {"enabled": true},
    "bank_transfer": {"enabled": true, "bankName": "[Bank name]", "accountTitle": "North Nectar", "iban": "[Your IBAN]"},
    "jazzcash": {"enabled": true, "number": "0316 4354407"},
    "easypaisa": {"enabled": true, "number": "0316 4354407"},
    "card": {"enabled": false}
  }',
  -- { enabled, rate, daysMin, daysMax }
  express jsonb not null default '{"enabled": true, "rate": 450, "daysMin": 1, "daysMax": 2}',
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (true) on conflict do nothing;

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Matched against the checkout city first, then the province. One zone is the fallback.
  cities text[] not null default '{}',
  provinces text[] not null default '{}',
  is_fallback boolean not null default false,
  rate integer not null check (rate >= 0),
  free_over integer check (free_over is null or free_over >= 0),
  days_min integer not null default 3 check (days_min >= 0),
  days_max integer not null default 5 check (days_max >= days_min),
  courier text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index shipping_zones_one_fallback on public.shipping_zones (is_fallback) where is_fallback;

insert into public.shipping_zones (name, cities, provinces, is_fallback, rate, free_over, days_min, days_max, courier, sort_order) values
  ('Islamabad and Rawalpindi', '{Islamabad,Rawalpindi}', '{}', false, 250, 5000, 1, 2, 'Leopards Courier', 1),
  ('Lahore', '{Lahore}', '{}', false, 250, 5000, 2, 3, 'TCS', 2),
  ('Karachi', '{Karachi}', '{}', false, 250, 5000, 2, 3, 'TCS', 3),
  ('Gilgit-Baltistan', '{Gilgit,Skardu,Hunza,Khaplu}', '{Gilgit-Baltistan}', false, 200, 5000, 1, 3, 'Local rider', 4),
  ('Rest of Punjab and KP', '{}', '{Punjab,"Khyber Pakhtunkhwa"}', false, 300, 5000, 2, 4, 'M&P', 5),
  ('Rest of Pakistan', '{}', '{}', true, 350, 5000, 3, 5, 'Pakistan Post', 6);

create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();
create trigger shipping_zones_touch before update on public.shipping_zones
  for each row execute function public.touch_updated_at();

alter table public.store_settings enable row level security;
alter table public.shipping_zones enable row level security;

create policy store_settings_read on public.store_settings for select to anon, authenticated using (true);
create policy store_settings_owner on public.store_settings for update to authenticated
  using (public.has_role('{owner}')) with check (public.has_role('{owner}'));
create policy shipping_zones_read on public.shipping_zones for select to anon, authenticated using (true);
create policy shipping_zones_owner on public.shipping_zones for all to authenticated
  using (public.has_role('{owner}')) with check (public.has_role('{owner}'));

grant select on public.store_settings, public.shipping_zones to anon, authenticated;
grant update on public.store_settings to authenticated;
grant insert, update, delete on public.shipping_zones to authenticated;
grant all on public.store_settings, public.shipping_zones to service_role;

-- Team: owners can see when each member was last active (already stored on sign-in).
alter table public.staff add column if not exists invited_at timestamptz;
