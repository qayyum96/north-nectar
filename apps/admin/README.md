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

## Orders, customers and messages (Phase 2)

- **Order flow:** pending → confirmed → shipped → delivered (or cancelled / returned). Each step runs
  in the database function `order_update_status`, which checks the step is allowed, moves stock and
  writes the timeline in one transaction. Placing an order reserves units, shipping removes them
  from stock (a "sale" stock movement), cancelling releases them, and a return can put them back.
- **WhatsApp:** after confirming, shipping or cancelling, the toast offers **Send on WhatsApp**,
  which opens your WhatsApp with the message already written (wa.me, free). Nothing is sent
  automatically; the timeline notes that the message was opened.
- **Create order** (`/orders/new`) is for phone and WhatsApp orders. Prices come from the database
  and stock is reserved the same way as website orders.
- **Invoices:** `/print/orders?numbers=NN1001,NN1002` (Print invoice / Print invoices).
- **Exports:** CSV, Excel (.xlsx, written without extra libraries) and PDF (a print view; choose
  "Save as PDF").
- **Messages:** opening a message marks it read; the sidebar badge counts unread messages.
  Replies open prefilled in WhatsApp or your email app. Sending email from the admin comes once a
  domain and the free Resend plan are set up.
- Orders and Customers have no Import button: the import wizard covers products, purchases and stock.

## Products and categories (Phase 3)

- Owners and managers only (the sidebar hides them from staff).
- **Saving** runs the database function `admin_save_product`: the product and all its sizes are
  saved together, a changed stock number is recorded as an "adjustment" stock movement, and a size
  that is still in open orders can't be removed.
- **Images** upload straight from the browser to the public Supabase Storage bucket `catalog`
  (`products/<id>/`, `categories/<id>/`). Each photo is resized to at most 1600 px and converted to
  WebP first, so the free 1 GB lasts. Removed images are deleted from storage when you save.
- **Description formatting:** **bold**, _italic_, **underline**, [links](https://…) and "- " lists.
  The website renders these safely (no raw HTML).
- **Website details** (tagline, short name, botanical name, origin, badge, home page flags, sort
  position, highlights, ways to enjoy, how to use, details table, size tags, related products) are
  the storefront-only fields that the mockup's editor didn't show.
- **Website refresh:** after every product or category change the admin calls the website's
  `/api/revalidate` (protected by `REVALIDATE_SECRET`, same value in both apps), so changes show
  straight away instead of within the hour.
- Unit costs come from purchases (or can be typed in the Adjust stock panel).

## Stock, suppliers, purchases and imports (Phase 4)

- **Stock** lists every size: on hand, reserved by open orders, available, low-stock level and
  value at cost. **Adjust stock** (add, remove or set a count, with a reason) creates an
  `ADJ-0001`-style stock movement; the same panel sets the low-stock level and unit cost.
- **Purchases** (`PO-0001`...): products add units to stock and update each size's unit cost (the
  latest purchase price, used for profit and stock value). Other items such as pouches and labels
  are recorded but not stocked. Part payments, a payment dialog and supplier balances are tracked.
- **Bills** (photo or PDF) go to the private storage bucket `bills` and open through a two-minute
  link, so they are never public.
- **Stock movements** is the ledger of every unit in and out (sales, purchases, adjustments,
  returns) with period totals and gross profit.
- **Import** (CSV or Excel, no extra libraries) for products, purchases and stock counts: upload,
  map columns (matched automatically), preview with row errors, confirm. Rows with errors can be
  skipped and downloaded later from **Import history**, where purchase and stock imports can be
  undone (if the units haven't been sold since). Product imports add new products as drafts and
  update prices of existing SKUs.

## Phases

| Phase | Scope                                                                           | Status |
| ----- | ------------------------------------------------------------------------------- | ------ |
| 1     | Foundation: schema, RLS, sign-in, shell, dashboard, search, website on Supabase | done   |
| 2     | Orders, customers, messages                                                     | done   |
| 3     | Products, categories, image upload                                              | done   |
| 4     | Stock, suppliers, purchases, movements, CSV import                              | done   |
| 5     | Reports and settings (payments and shipping rates move to the database)         |        |
| 6     | Audit                                                                           |        |
