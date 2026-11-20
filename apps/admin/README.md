# North Nectar admin portal

Internal app for running the shop: orders, customers, catalogue, stock, purchases, messages,
reports and settings. Built from the admin mockup (`NorthNectar-admin-mockup`, 43 screens) in six
phases. Next.js App Router on port **3001**, Supabase for data and sign-in.

## Run it

```bash
cp apps/admin/.env.example apps/admin/.env.local   # same Supabase values as apps/web
pnpm --filter @northnectar/admin dev               # http://localhost:3001
```

## First owner account

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**. Enter your email
   and a password, tick **Auto Confirm User**.
2. From the repo root: `pnpm admin:make-owner you@example.com "Your Name"`.
3. Sign in at `/login`. More staff are invited from **Settings → Team and roles** (Phase 5).

Supabase → **Authentication → URL Configuration**: set the Site URL to the admin address and add
`http://localhost:3001/**` (and the live admin URL, e.g. `https://admin.northnectar.com/**`) to the
Redirect URLs, so password reset links come back to the admin.

## How access works

- `proxy.ts` refreshes the Supabase session on every request and sends signed-out visitors to
  `/login`. The `(admin)` layout calls `requireStaff()`: only active rows in `public.staff` get in.
- Roles: `owner` (everything), `manager` (no settings), `staff` (orders, customers, stock,
  messages). The sidebar hides what a role can't open ([`lib/nav.ts`](lib/nav.ts)), and the same
  rules are enforced by row level security in the database
  ([`supabase/migrations`](../../supabase/migrations)).
- "Keep me signed in" unticked turns the auth cookies into browser-session cookies.
- The admin sends `X-Robots-Tag: noindex` and `X-Frame-Options: DENY`; `robots.txt` disallows all.

## Structure

```
app/(auth)/        login, forgot password, reset password (split art layout)
app/(admin)/       signed-in pages inside the shell; [...slug] shows "coming in Phase N"
app/auth/          email link callback and sign out routes
components/shell/  top bar, search, notifications, account menu, sidebar, mobile menu
components/ui.tsx  page header, cards, buttons, segmented tabs, status badges
lib/               auth, Supabase clients, dashboard queries, Pakistan-time helpers
```

## Phases

| Phase | Scope                                                                           | Status |
| ----- | ------------------------------------------------------------------------------- | ------ |
| 1     | Foundation: schema, RLS, sign-in, shell, dashboard, search, website on Supabase | done   |
| 2     | Orders, customers, messages                                                     |        |
| 3     | Products, categories, image upload                                              |        |
| 4     | Stock, suppliers, purchases, movements, CSV import                              |        |
| 5     | Reports and settings (payments and shipping rates move to the database)         |        |
| 6     | Audit                                                                           |        |
