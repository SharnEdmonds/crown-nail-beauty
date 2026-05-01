// /admin/customers — customer directory with visit count + name/phone/email search.

import Link from 'next/link';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('booking_customers')
    .select('id, name, phone, email, visit_count, last_seen_at, is_redacted')
    .order('last_seen_at', { ascending: false })
    .limit(200);

  if (q.length > 0) {
    // Substring match across name / phone / email. PostgREST's `or()` parses
    // commas as filter separators and parens as nesting — both must be stripped
    // from user input before composing the filter, in addition to ILIKE wildcards.
    // We strip them to a space rather than escape because we don't want them to
    // affect substring matching anyway.
    const cleaned = sanitizeForPostgrestFilter(q);
    const pattern = `%${escapeIlike(cleaned)}%`;
    query = query.or(
      `name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`,
    );
  }

  const { data: customers } = await query;

  return (
    <div>
      <h2 className="booking-heading" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Customers
      </h2>

      <form
        method="GET"
        action="/admin/customers"
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone or email…"
          className="booking-input"
          style={{ maxWidth: '24rem' }}
        />
        <button type="submit" className="booking-cta booking-cta--secondary" style={{ padding: '0.5rem 1rem' }}>
          Search
        </button>
        {q.length > 0 ? (
          <Link
            href="/admin/customers"
            className="booking-cta booking-cta--secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Clear
          </Link>
        ) : null}
        {q.length > 0 ? (
          <span className="booking-muted" style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
            {(customers ?? []).length} result{(customers ?? []).length === 1 ? '' : 's'}
          </span>
        ) : null}
      </form>

      <div className="booking-card" style={{ overflow: 'hidden' }}>
        <table className="booking-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Visits</th>
              <th>Last seen</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  {c.is_redacted ? (
                    <span className="booking-muted">REDACTED</span>
                  ) : (
                    c.name
                  )}
                </td>
                <td>{c.is_redacted ? '—' : c.phone}</td>
                <td>{c.is_redacted ? '—' : c.email ?? '—'}</td>
                <td>{c.visit_count}</td>
                <td className="booking-muted">
                  {new Date(c.last_seen_at).toLocaleDateString()}
                </td>
                <td>
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="booking-cta booking-cta--secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {(customers ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="booking-muted">
                  {q.length > 0 ? 'No matches.' : 'No customers yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function escapeIlike(s: string): string {
  // PostgreSQL ILIKE wildcards: % and _. Escape both so a literal "_" in a phone
  // search doesn't behave as a single-char wildcard.
  return s.replace(/[%_\\]/g, (m) => `\\${m}`);
}

function sanitizeForPostgrestFilter(s: string): string {
  // PostgREST or() filter syntax uses , ( ) as structural characters. Even
  // though escapeIlike runs after this, those characters would still be
  // interpreted as filter syntax. None of them are useful in a name/email/phone
  // substring search, so collapse to whitespace.
  return s.replace(/[,()*]/g, ' ').trim();
}
