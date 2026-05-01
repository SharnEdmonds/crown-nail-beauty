// /admin/customers/[id] — customer detail with booking history + redact action.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { client as sanityClient } from '@/sanity/lib/client';
import { BOOKING_SETTINGS_QUERY } from '@/booking/lib/queries';
import { formatCents } from '@/booking/lib/templating';
import type { BookingSettings } from '@/booking/lib/types';
import { CustomerActions } from '@/booking/components/admin/CustomerActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: customer, error } = await supabase
    .from('booking_customers')
    .select(
      'id, name, phone, email, visit_count, first_seen_at, last_seen_at, is_redacted',
    )
    .eq('id', id)
    .single();
  if (error || !customer) notFound();

  const { data: bookings } = await supabase
    .from('booking_appointments')
    .select(
      'id, status, service_name_snapshot, technician_name_snapshot, start_at, deposit_cents_snapshot, payment_method',
    )
    .eq('customer_id', id)
    .order('start_at', { ascending: false })
    .limit(50);

  const settings = await sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY);
  const tz = settings?.salonTimezone ?? 'UTC';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 16rem', gap: '1.25rem' }}>
      <div>
        <div className="booking-card booking-card-pad" style={{ marginBottom: '1rem' }}>
          <h2 className="booking-heading" style={{ fontSize: '1.25rem', marginTop: 0 }}>
            {customer.is_redacted ? (
              <span className="booking-muted">REDACTED</span>
            ) : (
              customer.name
            )}
          </h2>
          {customer.is_redacted ? (
            <p className="booking-muted" style={{ fontSize: '0.85rem' }}>
              This customer&apos;s personal data has been redacted. Bookings remain on
              file as financial records.
            </p>
          ) : (
            <>
              <Section label="Phone">{customer.phone}</Section>
              <Section label="Email">{customer.email ?? '—'}</Section>
            </>
          )}
          <Section label="Visits">{customer.visit_count}</Section>
          <Section label="First seen">
            {new Date(customer.first_seen_at).toLocaleDateString()}
          </Section>
          <Section label="Last seen">
            {new Date(customer.last_seen_at).toLocaleDateString()}
          </Section>
        </div>

        <div className="booking-card" style={{ overflow: 'hidden' }}>
          <table className="booking-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Service</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Deposit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(bookings ?? []).map((b) => (
                <tr key={b.id}>
                  <td className="booking-muted" style={{ fontSize: '0.85rem' }}>
                    {new Intl.DateTimeFormat('en-NZ', {
                      timeZone: tz,
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    }).format(new Date(b.start_at))}
                  </td>
                  <td>{b.service_name_snapshot}</td>
                  <td>{b.technician_name_snapshot}</td>
                  <td>{b.status.replace('_', ' ')}</td>
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
              ))}
              {(bookings ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="booking-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                    No bookings yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <aside>
        <CustomerActions
          customerId={customer.id}
          isRedacted={customer.is_redacted}
        />
      </aside>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '0.5rem 0',
        borderBottom: '1px solid var(--booking-color-border)',
      }}
    >
      <p
        className="booking-muted"
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </p>
      <div style={{ fontSize: '0.95rem' }}>{children}</div>
    </div>
  );
}
