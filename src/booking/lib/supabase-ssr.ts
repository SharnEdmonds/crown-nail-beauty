// Server-side Supabase client backed by the request's auth cookies.
// Used in admin server components / middleware to read the logged-in admin's session.
// Uses the ANON key (not service-role) — it operates as the logged-in user, not as admin-godmode.

import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getSupabaseSsr() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      '[booking] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.',
    );
  }
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Called from a Server Component; cookie writes are not allowed there.
            // Middleware / Route Handlers handle the actual write — this is safe to swallow.
          }
        }
      },
    },
  });
}
