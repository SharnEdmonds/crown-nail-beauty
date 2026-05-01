// Next.js middleware — admin route gate + Supabase session refresh.
//
// Runs at the edge BEFORE any layout/page renders.
// Checks: (1) authenticated session, (2) email in ADMIN_ALLOWLIST_EMAILS.
// Unauthorized requests are redirected to /admin/login.
//
// Also refreshes Supabase auth cookies if needed (per @supabase/ssr docs).

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ALLOWED = new Set(
  (process.env.ADMIN_ALLOWLIST_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Always pass through static + login + non-admin paths.
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isLogin = pathname.startsWith('/admin/login');
  // Cron endpoints have their own shared-secret auth via X-Cron-Secret header.
  const isCron =
    pathname.startsWith('/api/admin/expire-pending-cron') ||
    pathname.startsWith('/api/admin/backup-csv-cron') ||
    pathname.startsWith('/api/admin/review-email-cron') ||
    pathname.startsWith('/api/admin/sms-reminder-cron');
  if (!isAdmin || isLogin || isCron) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    // Misconfigured — refuse access.
    return redirectToLogin(request);
  }

  const response = NextResponse.next();

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

  const { data, error } = await supabase.auth.getUser();
  const email = data?.user?.email?.toLowerCase();
  if (error || !email || !ALLOWED.has(email)) {
    return redirectToLogin(request);
  }

  // For admin POST/PUT/DELETE/PATCH, also enforce same-origin Origin header.
  if (
    pathname.startsWith('/api/admin') &&
    !['GET', 'HEAD'].includes(request.method)
  ) {
    const origin = request.headers.get('origin');
    if (!origin || origin !== url.origin) {
      return new NextResponse(JSON.stringify({ error: 'cross_origin' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  return response;
}

function redirectToLogin(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
