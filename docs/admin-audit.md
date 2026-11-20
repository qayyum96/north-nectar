# Admin audit (Phase 6)

Date: 21 November 2026. Scope: the admin portal (`apps/admin`), the database
(`supabase/migrations`) and the parts of the storefront that write orders.

## How it was checked

- **Code review** of every server action, route handler, row level security policy and database
  function, in two independent passes: security (who can do what) and correctness (stock, money,
  dates, limits).
- **Role test**: temporary owner, manager and staff accounts opened every page and export. Each
  role reaches exactly what the sidebar shows; signed-out visitors are sent to sign in.
- **Database tests** against the real database with those accounts (25 checks), then all test
  rows removed and the order, purchase and adjustment numbers restarted.
- **Browser tests** of the changed screens (11 checks), including a real storefront order.
- **Lighthouse** (desktop) on 21 admin screens and a **phone-width sweep** (390 px) of 22 screens.

## Results

| Check                       | Result                                                                |
| --------------------------- | --------------------------------------------------------------------- |
| Lighthouse performance      | 94 to 100 on every screen (LCP 0.5 to 1.4 s, no blocking time, CLS 0) |
| Lighthouse accessibility    | 100 on every screen after the two fixes below                         |
| Lighthouse best practices   | 100                                                                   |
| Phone width (390 px)        | No sideways scrolling on any screen                                   |
| Role access (pages, export) | No gaps                                                               |

## What was fixed

**Security**

1. **Staff could rewrite orders and customers through the database API.** The app only edits
   notes, tags and courier, but the table permissions allowed any column, so a staff login could
   mark an order paid or change its total directly. Staff can now update only the columns the
   admin edits. Status, payment and stock changes go through the database functions as before.
   Timeline entries written from the admin must be notes or "WhatsApp opened" lines signed by the
   person writing them.
2. **Sign-in redirect could leave the admin** (`/login?next=/\evil.com`). `?next=` is now limited
   to paths inside the admin in all three places that read it.
3. **Invite links for existing members.** An owner could make a sign-in link for another active
   member (including another owner) and sign in as them. Links are now only made for people who
   haven't joined yet; members who have use "Forgot password". Inviting an existing member no
   longer changes their role.
4. **Order flooding.** At most five open online orders per phone number in 24 hours, so a script
   can't reserve all the stock with fake cash-on-delivery orders.
5. **Customer details overwritten by strangers.** Anyone who knew a customer's phone number could
   place an order and replace that customer's saved name and address. Online orders now only fill
   in details that are missing; the order itself keeps the address typed at checkout.
6. Smaller: search text escapes two more filter characters, the website refresh endpoint compares
   the secret safely for any input, and `NEXT_PUBLIC_ADMIN_URL` is documented so reset and invite
   links never depend on request headers.

**Stock and money**

1. **Saving a product could undo stock changes.** The editor sent back the stock count it loaded,
   so a purchase or shipped order recorded while it was open was reversed on save. Unchanged stock
   now keeps the live count; a changed count on an out-of-date page is refused with a clear
   message. The editor reloads fresh data after each save. The stock drawer sends only what
   changed, and its quantity now starts at 0 so changing the low-stock level can't move stock.
2. **The same size twice in one checkout skipped the stock check** (two lines of 1 unit could pass
   with 1 left). Lines are merged first, and sizes are locked in a fixed order.
3. **Totals stopped at 1,000 rows.** Supabase returns at most 1,000 rows per request, so reports,
   dashboard, KPIs and exports would have gone quietly wrong as the shop grew. They now read every
   page.
4. **Returned orders counted as revenue and profit.** Dashboard revenue and profit, and the
   Profit and Product performance reports, now leave out returned (refunded) orders. The Sales
   report keeps them in gross sales and shows them as Returns, as in the mockup. Dashboard profit
   now subtracts discounts like the reports.
5. **Undoing an import deleted ledger rows**, so running balances in Stock movements no longer
   added up. It now records reversing entries, and restores "no unit cost" when a size had none.
6. **Shipping rates save in one transaction**, so checkout never sees a moment with no "everywhere
   else" rate and nothing is half-saved.
7. **Staff-created orders used fixed delivery fees** (Rs 250 / 450). They now use the same zones
   as checkout.
8. **Checkout could get stuck** on "prices changed" if a rate changed after the page loaded. The
   server now sends the current rates back and the summary updates, so the next try goes through.
9. **Imports:** text dates like "2 Nov 2026" landed a day early, impossible dates like 31/02 were
   accepted, and "250g" could match a 50g size. All three fixed.
10. Smaller: wallets can't be switched on without a number, bank transfer rejects the placeholder
    bank name, bad dates in a URL no longer cause an error page, the return dialog ticks "refund"
    for orders marked paid in the same visit, and September shows as "Sep" everywhere.

**Accessibility:** the account menu's spoken name now starts with its visible text, and the
description editor's formatting buttons meet the 24 px minimum target size.

## Checked and already correct

Row level security is on for every table, and anonymous visitors can read only the live catalogue
and the shipping and payment settings. Every database function that bypasses security sets its
search path and checks the role. Prices, delivery and payment fees are recalculated on the server
for every order. The private bills bucket is readable only by owners and managers. Exports guard
against spreadsheet formulas and the print views escape HTML. Order status changes allow only
legal moves and can't run twice.

## Decisions for the owner

- **Staff can see unit costs** (stock value on the Stock page and in its export). Reports are
  hidden from staff, but cost is visible there. Hide it from staff if cost should stay private.
- **Bot protection on checkout.** The per-phone limit stops simple flooding. Cloudflare Turnstile
  (free) on checkout and the contact form would stop scripted spam; it needs a Cloudflare account.

## Before launch

1. In Supabase → Authentication → Sign In / Providers, turn off **Allow new users to sign up**
   (staff are invited from the admin).
2. Set `NEXT_PUBLIC_ADMIN_URL` to the live admin address on the admin host, and keep the Supabase
   Redirect URLs list to exactly the admin addresses.
3. Fill in the bank name and IBAN in Settings → Payments, or switch bank transfer off.
