-- Blog: articles and guides shown at /blog on the website and written in the admin (Blog).
-- * body: one string per block, the same marks as product descriptions (bold, links, "- " lists);
--   a block starting with "## " or "### " is a heading.
-- * related_products: product slugs shown under the article.
-- * The public (anon) can read published posts only; owners and managers edit.
create table if not exists public.posts (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.publish_status not null default 'draft',
  title text not null,
  excerpt text not null default '',
  body text[] not null default '{}',
  cover_image jsonb,
  related_products text[] not null default '{}',
  author text not null default 'North Nectar',
  published_at timestamptz,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

create index if not exists posts_published_idx on public.posts (status, published_at desc);

alter table public.posts enable row level security;

grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;

drop policy if exists posts_public on public.posts;
create policy posts_public on public.posts for select to anon
  using (status = 'active' and published_at is not null and published_at <= now());

drop policy if exists posts_staff_read on public.posts;
create policy posts_staff_read on public.posts for select to authenticated
  using (public.is_staff());

drop policy if exists posts_edit on public.posts;
create policy posts_edit on public.posts for all to authenticated
  using (public.has_role('{owner,manager}')) with check (public.has_role('{owner,manager}'));
