// Admin allowlist check. The single gate that determines whether a logged-in user
// is authorized to access /admin/* and /api/admin/*.
//
// The list lives in process.env.ADMIN_ALLOWLIST_EMAILS, comma-separated, lowercased.

import 'server-only';

import { getSupabaseSsr } from './supabase-ssr';

let cachedAllowlist: Set<string> | null = null;

function loadAllowlist(): Set<string> {
  if (cachedAllowlist) return cachedAllowlist;
  const raw = process.env.ADMIN_ALLOWLIST_EMAILS ?? '';
  const set = new Set<string>(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  cachedAllowlist = set;
  return set;
}

export interface AdminSession {
  email: string;
  userId: string;
}

/**
 * Returns the current admin session if the request is authenticated AND
 * the email is in the allowlist. Returns null otherwise.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const allowlist = loadAllowlist();
  if (allowlist.size === 0) {
    // No allowlist configured — refuse all admin access. Safer than open default.
    return null;
  }

  const supabase = await getSupabaseSsr();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.email) return null;

  const email = data.user.email.toLowerCase();
  if (!allowlist.has(email)) return null;

  return { email, userId: data.user.id };
}

/**
 * Validate that a request originates from our own domain. Defense-in-depth alongside
 * SameSite=Lax cookies. Use on every admin mutation endpoint.
 */
export function checkSameOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // No Origin header — treat conservatively. Same-origin GET typically omits this;
    // mutation endpoints should reject in this case.
    return false;
  }
  return allowedOrigins.includes(origin);
}
