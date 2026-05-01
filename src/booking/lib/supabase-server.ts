// SECURITY-CRITICAL FILE.
// This module holds the Supabase service-role key. It bypasses RLS and can read/write
// every row in the booking_* tables.
//
// Rules:
//   1. The 'server-only' import below causes Next.js to ERROR at build time if any
//      'use client' file imports from this module — even transitively. Do NOT remove it.
//   2. The env var SUPABASE_SERVICE_ROLE_KEY MUST NOT be prefixed NEXT_PUBLIC_.
//      Next.js will refuse to ship non-NEXT_PUBLIC_ env vars to the browser.
//   3. This module is imported only from server components and API routes.
//   4. Never `console.log` the client object or its config.

import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client authenticated with the service-role key.
 * This client BYPASSES Row-Level Security — only call from trusted server code.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      '[booking] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.',
    );
  }

  cachedClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      // Service-role client never uses session/refresh tokens.
      autoRefreshToken: false,
      persistSession: false,
    },
    db: { schema: 'public' },
    global: {
      headers: {
        // Identify ourselves in Supabase logs.
        'x-app-source': 'booking-server',
      },
    },
  });

  return cachedClient;
}

/**
 * Runtime sanity check: refuse to operate if the service-role key looks wrong
 * (e.g. accidentally swapped with the anon key).
 *
 * Service-role JWTs encode `role: "service_role"`; anon JWTs encode `role: "anon"`.
 * We do a quick check on the JWT payload without verifying the signature
 * (we don't need to verify — the worst case is calling the API and getting 401).
 */
export function assertServiceRoleKey(): void {
  if (!SERVICE_ROLE_KEY) return; // The other check in getSupabaseAdmin handles this.
  const parts = SERVICE_ROLE_KEY.split('.');
  if (parts.length !== 3) return; // Not a JWT — let it fail later.
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf8'),
    ) as { role?: string };
    if (payload.role && payload.role !== 'service_role') {
      throw new Error(
        `[booking] SUPABASE_SERVICE_ROLE_KEY looks like a "${payload.role}" key, ` +
          'not a service-role key. Refusing to start.',
      );
    }
  } catch {
    // JWT decode failed — let downstream calls handle the error.
  }
}
