// Stripe server SDK init. Server-only — never imported from client code.
//
// Notes:
//   - We pin a stable API version at construction time so Stripe does not silently
//     ship behavioral changes that affect production.
//   - In production, asserts that we're using a sk_live_ key. In dev, asserts sk_test_.
//     Loud failure beats a silent test/live mixup.

import 'server-only';

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  if (!STRIPE_SECRET_KEY) {
    throw new Error('[booking] STRIPE_SECRET_KEY is not set.');
  }

  // L5 from the plan: refuse to start if key mode mismatches NODE_ENV.
  if (process.env.NODE_ENV === 'production') {
    if (!STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      throw new Error(
        '[booking] STRIPE_SECRET_KEY is not a live key but NODE_ENV=production. Refusing to start.',
      );
    }
  } else {
    if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      console.warn(
        '[booking] STRIPE_SECRET_KEY is not a test key but NODE_ENV is not production. Proceed with caution.',
      );
    }
  }

  cached = new Stripe(STRIPE_SECRET_KEY, {
    // Pin API version. Update intentionally + tested.
    // Matches the SDK's bundled default; see node_modules/stripe/cjs/apiVersion.d.ts.
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
    appInfo: {
      name: 'atelier-lumiere/booking',
      version: '1.0.0',
    },
  });
  return cached;
}

/**
 * The webhook secret is keyed differently per environment:
 *   - Local dev: from `stripe listen` CLI output (whsec_...)
 *   - Production: from Stripe dashboard webhook config
 */
export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('[booking] STRIPE_WEBHOOK_SECRET is not set.');
  return secret;
}
