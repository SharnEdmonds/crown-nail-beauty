// /admin/refunds — read-only refund audit log.

import Link from 'next/link';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { formatCents } from '@/booking/lib/templating';

export const dynamic = 'force-dynamic';

export default async function AdminRefundsPage() {
  const supabase = getSupabaseAdmin();
  const { data: refunds } = await supabase
    .from('booking_refund_log')
    .select('id, booking_id, admin_email, amount_cents, currency, stripe_refund_id, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <h2 className="booking-heading" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
        Refund log
      </h2>
      <p className="booking-helper" style={{ marginBottom: '1rem' }}>
        Append-only audit trail of every refund issued from this admin.
      </p>
      <div className="booking-card" style={{ overflow: 'hidden' }}>
        <table className="booking-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Booking</th>
              <th>By</th>
              <th>Amount</th>
              <th>Stripe refund</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {(refunds ?? []).map((r) => (
              <tr key={r.id}>
                <td className="booking-muted">{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  <Link
                    href={`/admin/bookings/${r.booking_id}`}
                    style={{ color: 'var(--booking-color-accent)' }}
                  >
                    {r.booking_id.slice(0, 8)}…
                  </Link>
                </td>
                <td>{r.admin_email}</td>
                <td>{formatCents(r.amount_cents)} {r.currency.toUpperCase()}</td>
                <td className="booking-muted" style={{ fontSize: '0.75rem' }}>
                  {r.stripe_refund_id}
                </td>
                <td>{r.reason ?? '—'}</td>
              </tr>
            ))}
            {(refunds ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="booking-muted">
                  No refunds yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
