# Resend domain verification

Until your sending domain is verified in Resend, customer confirmation emails
will only deliver to the Resend account-owner's email — i.e. real customers
booking with their own address won't receive anything.

This guide walks through the one-time DNS setup. ~15 minutes.

## What you need

- Admin access to the DNS for the domain you want to send from (likely
  `crownnailbeauty.co.nz` or `vanturadigital.co.nz`).
- Resend dashboard access.

## Steps

### 1. Add the domain in Resend

1. https://resend.com/domains → **Add Domain**.
2. Enter `crownnailbeauty.co.nz` (recommended — branded as the salon).
3. Choose region: **Tokyo** for NZ proximity, or any default.
4. Resend shows you 3 DNS records: a SPF/MX-style TXT, a DKIM TXT, and a DMARC TXT.

### 2. Add the records to your DNS

Wherever you manage DNS (Cloudflare, Namecheap, the registrar's panel), add the
3 records exactly as shown. Each is a `Type / Name / Value`. Important notes:

- The DKIM record value starts `p=...`. Paste the entire string. Some DNS panels
  cap TXT values at 255 chars — Cloudflare auto-splits, others may need you to
  break it into multiple quoted strings.
- The DMARC record `p=` policy starts at `p=none` (monitoring only). Once you
  see good delivery for a few weeks, you can tighten to `p=quarantine`.
- `Name` (sometimes called Host or Subdomain) is what Resend shows literally —
  e.g. `_dmarc` or `resend._domainkey`. Don't add the apex domain.

### 3. Verify in Resend

Back in the dashboard, click **Verify**. DNS propagation usually takes 1–10
minutes; can stretch to a few hours. Resend shows green ticks when each record
is detected.

### 4. Update `RESEND_FROM_EMAIL`

Once verified, swap `.env.local` (and the Railway env vars when you deploy):

```
RESEND_FROM_EMAIL=Crown Nail & Beauty <bookings@crownnailbeauty.co.nz>
```

Restart `npm run dev` to pick up the new env var.

### 5. Test

1. Make a booking on `/book` using a different email address than your Resend
   account-owner email — e.g. a Gmail you don't have on Resend.
2. Confirm the deposit via Stripe test card.
3. The confirmation email should arrive at that address (check spam first if
   you set DMARC `p=quarantine`).

## Troubleshooting

- **"Domain not verified" error from Resend SDK at send time:**
  the `from` domain in `RESEND_FROM_EMAIL` must match a verified domain. Don't
  use one address from one verified domain and `from` from a different one.
- **Emails go to spam:** start with DMARC `p=none`. Send a few real emails. Add
  a reply-to header pointing to the salon's actual reachable inbox. After ~2
  weeks of clean reputation, tighten to `p=quarantine`.
- **DKIM record looks "split" in your DNS panel:** copy each chunk between the
  quotes verbatim, no spaces between chunks. Resend's verifier joins them.

## What "test mode" looks like before verification

Resend's `onboarding@resend.dev` sender works without verification but only
delivers to **the email address that signed up for Resend**. Any other recipient
gets dropped silently. Useful for local dev; not for production.
