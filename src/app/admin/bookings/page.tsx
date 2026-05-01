// /admin/bookings — list of bookings with status filter.

import Link from 'next/link';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { client as sanityClient } from '@/sanity/lib/client';
import { BOOKING_SETTINGS_QUERY } from '@/booking/lib/queries';
import type { BookingSettings } from '@/booking/lib/types';
import { formatCents } from '@/booking/lib/templating';

export const dynamic = 'force-dynamic';

const STATUS_FILTERS = [
  'all',
  'pending_payment',
  'confirmed',
  'cancelled',
  'completed',
  'expired',
] as const;

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = (STATUS_FILTERS as readonly string[]).includes(params.status ?? '')
    ? (params.status as (typeof STATUS_FILTERS)[number])
    : 'all';

  const supabase = getSupabaseAdmin();
  let q = supabase
    .from('booking_appointments')
    .select(
      'id, status, service_name_snapshot, technician_name_snapshot, start_at, deposit_cents_snapshot, payment_method, customer_id',
    )
    .order('start_at', { ascending: false })
    .limit(200);
  if (filter !== 'all') {
    q = q.eq('status', filter);
  }
  const { data: bookings } = await q;

  const settings = await sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY);
  const tz = settings?.salonTimezone ?? 'UTC';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <h2 className="booking-heading" style={{ fontSize: '1.25rem', margin: 0 }}>
          Bookings
        </h2>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={`/admin/bookings${s === 'all' ? '' : `?status=${s}`}`}
              className={`booking-cta booking-cta--secondary`}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.7rem',
                background:
                  filter === s ? 'var(--booking-color-accent-muted)' : undefined,
                borderColor:
                  filter === s ? 'var(--booking-color-accent)' : undefined,
              }}
            >
              {s.replace('_', ' ')}
            </Link>
          ))}
        </div>
      </div>

      <div className="booking-card" style={{ overflow: 'hidden' }}>
        <table className="booking-table">
          <thead>
            <tr>
              <th>Date / time</th>
              <th>Service</th>
              <th>Technician</th>
              <th>Status</th>
              <th>Source</th>
              <th>Deposit</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((b) => {
              const start = new Date(b.start_at);
              const dt = new Intl.DateTimeFormat('en-NZ', {
                timeZone: tz,
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              }).format(start);
              return (
                <tr key={b.id}>
                  <td>{dt}</td>
                  <td>{b.service_name_snapshot}</td>
                  <td>{b.technician_name_snapshot}</td>
                  <td>
                    <span className={badgeClassFor(b.status)}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="booking-muted">{b.payment_method}</td>
                  <td>{formatCents(b.deposit_cents_snapshot)}</td>
                  <td>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="booking-cta booking-cta--secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(bookings ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="booking-muted">
                  No bookings.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function badgeClassFor(status: string): string {
  if (status === 'confirmed') return 'booking-badge booking-badge--success';
  if (status === 'pending_payment') return 'booking-badge booking-badge--warning';
  if (status === 'cancelled' || status === 'expired') return 'booking-badge booking-badge--error';
  return 'booking-badge booking-badge--accent';
}
