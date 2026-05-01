# Stripe production webhook setup

Without a webhook configured for the production environment, **no booking ever
gets marked `confirmed`** in Supabase — the entire `pending → confirmed` flow
runs only via the webhook.

This guide is for moving from local dev (where `stripe listen` does the work) to
a live deployment on Railway. ~5 minutes.

## What you need

- Railway deployment URL (custom domain or `*.up.railway.app`).
- Stripe dashboard access.
- The production Stripe API keys (from the dashboard's **Live mode**, not test).

## Steps

### 1. Switch Stripe dashboard to Live mode

Top-right of dashboard → **Test / Live** toggle → **Live**. The keys, webhooks,
and events are completely separate from test mode.

### 2. Create the webhook endpoint

1. **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://your-railway-domain.com/api/booking/stripe-webhook`.
   Use the actual domain you've pointed at Railway, not the `up.railway.app`
   subdomain unless you're using that as your production URL.
3. **Select events to listen to**: just `checkout.session.completed`. (We don't
   handle other events. Adding more is wasted bandwidth.)
4. **Add endpoint**.

### 3. Copy the signing secret

On the new endpoint's detail page, click **Reveal** under "Signing secret".
Copy the value — starts with `whsec_...`. **This is different from the local
dev secret** that `stripe listen` printed.

### 4. Set Railway env vars

In Railway dashboard, on the `web` service, edit Variables:

```
STRIPE_SECRET_KEY=sk_live_...        # from Live mode → API keys
STRIPE_WEBHOOK_SECRET=whsec_...      # the one you just copied
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Railway will redeploy automatically when env vars change.

### 5. Verify

Make a test booking on the live site using a real card (or Stripe's test card
in test mode briefly — see "Pre-launch testing" below). The webhook tab in
Stripe shows event delivery status. Should show `200 OK` within a few seconds.

If it fails:

- **`400 invalid_signature`** → the secret is wrong. Re-copy from Stripe
  dashboard. Make sure it's the LIVE-mode secret if the keys are live.
- **`500 handler_failed`** → check Railway logs. Likely a Supabase or env-var
  issue, not Stripe.
- **No event delivered** → endpoint URL typo. Verify with `curl` returns
  `{"error":"missing_signature"}` (which is expected for a manual GET — proves
  the route is reachable).

## Pre-launch testing on the production URL

You don't need to flip to Live mode for the whole site. You can:

1. Create a *second* webhook endpoint using your **test mode** keys, also
   pointing at the Railway URL but with a different signing secret.
2. Set `STRIPE_SECRET_KEY=sk_test_...` and the corresponding `whsec_...` on
   Railway temporarily. This lets you make real fake bookings on the
   production environment without taking real money.
3. Once happy, swap to live keys + secret.

## Going live checklist

- [ ] Resend domain verified (see `resend-domain-setup.md`).
- [ ] `RESEND_FROM_EMAIL` set to a `@yourdomain` address.
- [ ] `STRIPE_SECRET_KEY` is `sk_live_...` (not `sk_test_...`).
- [ ] `STRIPE_WEBHOOK_SECRET` matches the production endpoint's signing secret.
- [ ] Stripe webhook endpoint listed in dashboard with status "Enabled".
- [ ] First test booking flips to `confirmed` in `/admin/bookings`.
- [ ] Confirmation email lands in customer's inbox.
- [ ] Owner notification email lands in `bookingSettings.ownerNotificationEmails`.
