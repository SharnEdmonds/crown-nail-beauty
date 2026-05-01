// GET /auth/callback?code=... — Supabase Auth magic-link redirect handler.
//
// Magic-link emails redirect here with `?code=...`. We exchange the code for a
// session (which sets the auth cookies on the response) and then forward the
// user to the original destination (default /admin).
//
// Refusing to log in non-allowlisted emails happens in the proxy on the next
// navigation — this route just establishes the session.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { safeNext } from '@/booking/lib/safe-next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNext(
    url.searchParams.get('next') ?? url.searchParams.get('redirect'),
  );

  if (!code) {
    const u = new URL('/admin/login', request.url);
    u.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(u);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    const u = new URL('/admin/login', request.url);
    u.searchParams.set('error', 'misconfigured');
    return NextResponse.redirect(u);
  }

  const response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const u = new URL('/admin/login', request.url);
    u.searchParams.set('error', 'exchange_failed');
    return NextResponse.redirect(u);
  }

  return response;
}
