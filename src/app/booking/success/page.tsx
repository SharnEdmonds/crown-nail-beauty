// Post-Stripe redirect. Server component:
//   1. Reads ?session_id from URL
//   2. Looks up the booking by stripe_checkout_session_id (DB-trusted)
//   3. If booking is confirmed → set HTTP-only recognition cookie + show success
//   4. If still pending_payment → show "we're processing" with a few-second poll
//
// Critical: never trust query params for displayed content. Fetch from DB.

import { notFound } from 'next/navigation';
import '@/booking/styles/booking.css';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { themeCssText } from '@/booking/lib/theme-css';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { setRecognitionCookie } from '@/booking/lib/cookies';
import { COPY_DEFAULTS } from '@/booking/lib/copy-defaults';
import { renderTemplate, formatCents } from '@/booking/lib/templating';
import type {
  BookingCopy,
  BookingSettings,
  BookingTheme,
} from '@/booking/lib/types';
import { SuccessClient } from './success-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;
  if (!sessionId) notFound();

  const [theme, copy, settings] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
  ]);

  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase
    .from('booking_appointments')
    .select(
      'id, status, customer_id, service_name_snapshot, technician_name_snapshot, service_price_cents_snapshot, deposit_cents_snapshot, start_at, end_at',
    )
    .eq('stripe_checkout_session_id', sessionId)
    .single();

  if (!booking) {
    return (
      <SuccessShell theme={theme}>
        <p>{copyOrDefault(copy, 'errorsGeneric')}</p>
      </SuccessShell>
    );
  }

  // Set recognition cookie on confirmed bookings
  if (booking.status === 'confirmed' && booking.customer_id) {
    try {
      await setRecognitionCookie(booking.customer_id);
    } catch (err) {
      console.warn('[booking success] cookie set failed', err);
    }
  }

  // Look up the customer's first name (for welcome message)
  let firstName = '';
  let customerEmail = '';
  if (booking.customer_id) {
    const { data: cust } = await supabase
      .from('booking_customers')
      .select('name, email')
      .eq('id', booking.customer_id)
      .single();
    if (cust) {
      firstName = (cust.name ?? '').split(/\s+/)[0] ?? '';
      customerEmail = cust.email ?? '';
    }
  }

  const tz = settings?.salonTimezone ?? 'UTC';
  const start = new Date(booking.start_at);
  const dateStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(start);
  const timeStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);

  const balance =
    booking.service_price_cents_snapshot - booking.deposit_cents_snapshot;

  const vars = {
    firstName,
    service: booking.service_name_snapshot,
    tech: booking.technician_name_snapshot,
    date: dateStr,
    time: timeStr,
    email: customerEmail,
    balance: formatCents(balance),
    address: '',
  };

  return (
    <SuccessShell theme={theme}>
      <SuccessClient
        copy={copy}
        theme={theme}
        status={booking.status}
        sessionId={sessionId}
        vars={vars}
      />
    </SuccessShell>
  );
}

function SuccessShell({
  theme,
  children,
}: {
  theme: BookingTheme | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(theme) }} />
      <div className="booking-root">
        <div className="booking-page">
          <div className="booking-shell" style={{ maxWidth: '40rem' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

function copyOrDefault(copy: BookingCopy | null, key: keyof typeof COPY_DEFAULTS): string {
  const v = (copy as Record<string, unknown> | null)?.[key as string];
  if (typeof v === 'string' && v.length > 0) return renderTemplate(v);
  const d = COPY_DEFAULTS[key];
  return typeof d === 'string' ? d : '';
}
