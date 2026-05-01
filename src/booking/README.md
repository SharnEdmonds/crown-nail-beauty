# Atelier Lumière — Booking Module (Demo)

Self-contained booking system. Marketing-site code never imports from this module.

## Structure

```
src/
├── booking/
│   ├── components/         (wizard + admin UI)
│   ├── lib/                (server + client booking logic)
│   ├── styles/booking.css  (CSS-vars-based styling — every color is themed)
│   └── README.md
├── sanity/schemaTypes/booking/  (5 schemas)
├── app/
│   ├── book/                       (public wizard)
│   ├── booking/success/            (post-Stripe redirect)
│   ├── booking/cancel/[token]/     (self-service cancel)
│   ├── admin/                      (auth-gated dashboard)
│   └── api/booking, api/admin/     (backend endpoints)
└── middleware.ts                   (admin auth gate)
```

## Configuration

Owner-editable in Sanity Studio under the **Booking** group:

- **Booking Settings** — operational config (timezone, slot interval, booking window, cancellation cutoff, policies).
- **Booking Theme** — every color, font, logo, radius. Edits propagate within ~60s without redeploy.
- **Booking Copy** — every visible string + email body, organized by tabs (Wizard, Steps, Errors, Success, Cancel, Emails, Admin).
- **Services** — bookable services with duration, buffer, price, deposit.
- **Technicians** — name, photo, services performed, weekly schedule (per day with optional lunch break), one-off time off.

## Environment variables

See `.env.local.example` — covers Supabase, Stripe, Resend, Upstash, admin allowlist, cron secret.

## Operational notes

### Initial setup

1. Apply Supabase migrations: `npm run supabase:migrate` (requires `SUPABASE_DB_URL` pointing to the **Session pooler**).
2. Verify exclusion constraint: `npm run supabase:test-exclusion`.
3. Seed Sanity content: open the hosted Sanity Studio (`https://<your-studio-host>.sanity.studio`) → Booking → fill in Settings, Theme, Copy, then add Services and Technicians.
4. Configure Stripe webhook → `https://<domain>/api/booking/stripe-webhook` listening for `checkout.session.completed`.
5. Set up Railway cron service hitting `https://<domain>/api/admin/expire-pending-cron` hourly with `X-Cron-Secret` header equal to `CRON_SECRET`.

### Adding a technician

1. Sanity Studio → Booking → Technicians → Create.
2. Set name, services performed, weekly schedule (toggle working days, set hours, optional break).
3. Save. They appear on `/book` immediately.

### Adding a service

1. Sanity Studio → Booking → Services → Create.
2. Set title, duration, buffer, full price (cents), deposit (cents).
3. Assign to technicians via their `services` array.
4. Save.

### Resending a booking confirmation

Currently manual — open the booking in `/admin/bookings/[id]` and use Stripe Dashboard's "send receipt" if needed. Future: add a Resend Confirmation button.

### Refunding a booking

`/admin/bookings/[id]` → Refund button → modal requires typing the customer's first name → server re-validates → Stripe refund (idempotency-keyed) → booking marked cancelled → cancellation email sent.

### Cancelling without refund

Same flow but the modal requires typing literal `CANCEL`. Used for late cancellations or no-shows where the deposit is retained per policy.

### Customer self-cancel

Confirmation email contains a link `/booking/cancel/[token]`. Token is one-shot, time-gated (must be ≥ `cancellationCutoffHours` before appointment), and the page handles the Stripe refund automatically.

### Privacy Act compliance

- Customer redact: open `/admin/customers/[id]` → "Redact" — sets `is_redacted=true`, name/email/phone become 'REDACTED' across the admin and the customer can no longer be recognized via cookie.
- Bookings are preserved (financial record) but the customer columns are blanked.

### Manual / phone bookings

`/admin/bookings/new` — same availability rules, bypasses Stripe. Choose `in_store` (balance paid in person) or `comp` (no charge).

## Security guarantees

- **No double-bookings**: Postgres `EXCLUDE USING gist` constraint enforces it at the DB level.
- **No fake confirmations**: only the verified Stripe webhook can mark a booking `confirmed`.
- **No service-role key leakage**: `'server-only'` import in `supabase-server.ts`.
- **No hardcoded brand-color classes**: `npm run check:booking-colors` enforces it (CI gate).
- **Admin gated**: middleware-level Supabase session + email allowlist before any layout renders.
- **Refund safety**: server re-validates customer-name confirmation; Stripe refund first with idempotency keys; audit log per refund.
- **Self-cancel safety**: 256-bit random tokens, one-shot, time-gated, generic errors.

## Incident response (Privacy Act)

If a booking-data breach is suspected:
1. Rotate `SUPABASE_SERVICE_ROLE_KEY` and Stripe keys immediately.
2. Snapshot `booking_appointments`, `booking_customers`, `booking_refund_log`, `booking_webhook_log` for forensics.
3. Notify Office of the Privacy Commissioner (NZ) if the breach affects ≥1 individual: `notify@privacy.org.nz`.
4. Notify affected customers via Resend.

## Owner emails (notifications)

Set in Sanity → Booking Settings → Owner notification emails. Each new confirmed booking triggers an email to every address in this list.
