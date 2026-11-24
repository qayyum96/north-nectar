-- Category page content for search: longer text shown below the products ("content", one string
-- per paragraph, same formatting as product descriptions) and common questions with answers
-- ("faqs", [{ "question": "...", "answer": "..." }]). Both are edited in the admin (Categories).
-- Covered by the existing table grant and row policies on public.categories.
alter table public.categories
  add column if not exists content text[] not null default '{}',
  add column if not exists faqs jsonb not null default '[]'::jsonb;

alter table public.categories
  drop constraint if exists categories_faqs_is_array;
alter table public.categories
  add constraint categories_faqs_is_array check (jsonb_typeof(faqs) = 'array');
