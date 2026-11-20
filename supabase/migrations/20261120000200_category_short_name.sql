-- Shorter label for chips and navigation (e.g. "Honey" for "Pure Honey").
alter table public.categories add column if not exists short_name text;
