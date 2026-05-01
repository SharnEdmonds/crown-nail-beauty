// /admin/bookings/[id] — booking detail with actions.

import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { client as sanityClient } from '@/sanity/lib/client';
import { BOOKING_SETTINGS_QUERY, TECHNICIANS_QUERY } from '@/booking/lib/queries';
import { formatCents } from '@/booking/lib/templating';
import type { BookingSettings, Technician } from '@/booking/lib/types';
import { BookingActions } from '@/booking/components/admin/BookingActions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: booking, error } = await supabase
    .from('booking_appointments')
    .select(
      `id, status, service_sanity_id, additional_service_sanity_ids,
       service_name_snapshot, technician_sanity_id, technician_name_snapshot,
       service_price_cents_snapshot, deposit_cents_snapshot, buffer_min_snapshot,
       service_duration_min_snapshot, start_at, end_at, payment_method, source,
       notes, stripe_payment_intent_id, amount_paid_cents, currency,
       cancelled_at, cancelled_by, customer_id, created_at`,
    )
    .eq('id', id)
    .single();

  if (error || !booking) notFound();

  let customer: { name: string; phone: string; email: string | null } | null = null;
  if (booking.customer_id) {
    const { data: c } = await supabase
      .from('booking_customers')
      .select('name, phone, email')
      .eq('id', booking.customer_id)
      .single();
    if (c) customer = { name: c.name, phone: c.phone, email: c.email };
  }

  const [settings, technicians] = await Promise.all([
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
  ]);
  const tz = settings?.salonTimezone ?? 'UTC';

  const start = new Date(booking.start_at);
  const dateStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start);
  const timeStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);

  const balance =
    booking.service_price_cents_snapshot - booking.deposit_cents_snapshot;
  const refundable =
    booking.status === 'confirmed' &&
    booking.payment_method === 'stripe' &&
    booking.stripe_payment_intent_id;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 16rem', gap: '1.25rem' }}>
      <div className="booking-card booking-card-pad">
        <h2 className="booking-heading" style={{ fontSize: '1.25rem', marginTop: 0 }}>
          {booking.service_name_snapshot}
        </h2>
        <p className="booking-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
          ID: {booking.id} · created {new Date(booking.created_at).toLocaleString()}
        </p>

        <Section label="Status">{booking.status.replace('_', ' ')}</Section>
        <Section label="When">{dateStr} · {timeStr}</Section>
        <Section label="Technician">{booking.technician_name_snapshot}</Section>
        <Section label="Duration">
          {booking.service_duration_min_snapshot} min ({booking.buffer_min_snapshot}m buffer)
        </Section>
        <Section label="Customer">
          {customer ? (
            <>
              {customer.name}
              <br />
              <span className="booking-muted" style={{ fontSize: '0.8rem' }}>
                {customer.phone}
                {customer.email ? ` · ${customer.email}` : ''}
              </span>
            </>
          ) : (
            '—'
          )}
        </Section>
        {booking.notes ? <Section label="Notes">{booking.notes}</Section> : null}
        <Section label="Pricing">
          Service {formatCents(booking.service_price_cents_snapshot)} · Deposit{' '}
          {formatCents(booking.deposit_cents_snapshot)} · Balance{' '}
          {formatCents(balance)}
        </Section>
        <Section label="Payment">
          {booking.payment_method}{' '}
          {booking.amount_paid_cents != null
            ? `· paid ${formatCents(booking.amount_paid_cents)}`
            : ''}
        </Section>
        {booking.cancelled_at ? (
          <Section label="Cancelled">
            {new Date(booking.cancelled_at).toLocaleString()} · by{' '}
            {booking.cancelled_by ?? '—'}
          </Section>
        ) : null}
      </div>

      <aside>
        <BookingActions
          bookingId={booking.id}
          status={booking.status}
          refundableCents={refundable ? booking.amount_paid_cents ?? booking.deposit_cents_snapshot : 0}
          customerFirstName={(customer?.name ?? '').split(/\s+/)[0] ?? ''}
          serviceIds={[
            booking.service_sanity_id,
            ...((booking.additional_service_sanity_ids as string[] | null) ?? []),
          ]}
          currentTechId={booking.technician_sanity_id}
          currentStartUtc={booking.start_at}
          currentNotes={booking.notes ?? null}
          technicians={technicians.filter((t) => t.isActive)}
          tz={tz}
        />
      </aside>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '0.75rem 0',
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
