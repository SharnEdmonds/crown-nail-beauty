// Validate the `?next=` param on the auth callback. Same-origin admin paths
// only — closes open-redirect risk after magic-link login.
//
// Pure function, no Node/Next dependencies. Unit-testable in isolation.

const ALLOWED_NEXT_PREFIXES = ['/admin'];

export function safeNext(value: string | null | undefined): string {
  if (!value) return '/admin';
  if (value.startsWith('//') || value.includes('://')) return '/admin';
  if (!value.startsWith('/')) return '/admin';
  // Compare against the path portion only — query strings and fragments are
  // allowed (they ride along with the redirect to /admin).
  const pathOnly = value.split(/[?#]/, 1)[0];
  if (
    !ALLOWED_NEXT_PREFIXES.some(
      (p) => pathOnly === p || pathOnly.startsWith(`${p}/`),
    )
  ) {
    return '/admin';
  }
  return value;
}
