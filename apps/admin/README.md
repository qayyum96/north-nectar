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
3. Sign in at `/login`. More staff are invited from **Settings → Team and roles**.

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
- **Images** are resized in the browser (at most 1600 px, WebP, usually 150–400 KB, never over 1 MB) and saved to
  **Cloudflare R2** (`products/<id>/`, `categories/<id>/`), served from `NEXT_PUBLIC_MEDIA_URL`
  (e.g. `https://images.northnectar.com`). R2's free plan has 10 GB and no download fees. Until the
  R2 keys are set, uploads go to the Supabase Storage bucket `catalog` (1 GB free) instead; run
  `pnpm media:to-r2` once after setting the keys to move those files and update the database. The
  original images that came with the site stay in `apps/web/public/images`. Purchase bills stay in
  the private Supabase bucket `bills`. Removed images are deleted from storage when you save.
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

## Reports and settings (Phase 5)

- **Reports** (owner and manager): Sales, Purchases, Profit and Product performance for Today, 7
  days, 30 days or custom dates, each compared with the period before, with a 12-week bar chart
  (the selected period in dark green, the current week in bright green) and a table. **Export
  report** downloads the headline numbers, the 12 weeks and the table as one Excel sheet; each
  table's **Export** downloads that table as CSV. Cancelled orders are left out. Profit uses each
  order line's unit cost at the time of sale; sizes with no cost are flagged instead of counted as
  free.
- **Settings** (owner only):
  - **Store details** (name, contact, address) print on invoices.
  - **Payments**: switch cash on delivery, bank transfer, JazzCash and Easypaisa on or off, and set
    the bank details and wallet numbers shown at checkout. Bank transfer can't be saved on with the
    placeholder bank name or IBAN. Cards stay off until a payment gateway exists.
  - **Shipping**: rates by city or zone (cities, provinces, rate, free-delivery amount, delivery
    days, courier), one "everywhere else" zone, and express delivery. Checkout matches the
    customer's city first, then province, then "everywhere else", and the server recalculates the
    fee when the order is placed.
  - **Team and roles**: invite a member (name, email, role). Supabase's free email limit is tiny,
    so the admin makes a one-time invite link to send on WhatsApp or by email; it opens "Choose a
    new password". New links and removing a member are in the row menu; you can't change your own
    role.
- Saving payments or shipping refreshes the website straight away through `/api/revalidate`
  (`REVALIDATE_SECRET` must match in both apps, and `NEXT_PUBLIC_STOREFRONT_URL` must point at
  the live shop). Checkout, cart, top bar, footer badges, product delivery notes, the shipping
  policy and Google product data all read these settings.

## Phases

| Phase | Scope                                                                                       | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------ |
| 1     | Foundation: schema, RLS, sign-in, shell, dashboard, search, website on Supabase             | done   |
| 2     | Orders, customers, messages                                                                 | done   |
| 3     | Products, categories, image upload                                                          | done   |
| 4     | Stock, suppliers, purchases, movements, CSV import                                          | done   |
| 5     | Reports and settings (payments and shipping rates move to the database)                     | done   |
| 6     | Audit: security, stock and money fixes, accessibility ([report](../../docs/admin-audit.md)) | done   |
