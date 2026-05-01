// /booking/cancel/[token] — customer-facing cancel UI.
// Server-side reads the booking, shows summary + confirm button.
// Submission goes to POST /api/booking/cancel/[token].

import '@/booking/styles/booking.css';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { themeCssText } from '@/booking/lib/theme-css';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { formatCents } from '@/booking/lib/templating';
import type {
  BookingCopy,
  BookingSettings,
  BookingTheme,
} from '@/booking/lib/types';
import { CancelClient } from './cancel-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CancelPage({ params }: PageProps) {
  const { token } = await params;
  const [theme, copy, settings] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
  ]);
  if (!settings) return notFoundShell(theme);

  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase
    .from('booking_appointments')
    .select(
      `id, status, service_name_snapshot, technician_name_snapshot, start_at,
       deposit_cents_snapshot, amount_paid_cents, payment_method,
       cancel_token_used_at`,
    )
    .eq('cancel_token', token)
    .single();

  if (!booking) return notFoundShell(theme);

  const tz = settings.salonTimezone;
  const cutoffMs = settings.cancellationCutoffHours * 60 * 60 * 1000;
  const isPastCutoff = new Date(booking.start_at).getTime() - Date.now() < cutoffMs;
  const alreadyUsed = !!booking.cancel_token_used_at || booking.status !== 'confirmed';

  const dateStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(booking.start_at));
  const timeStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(booking.start_at));

  const refundAmount =
    booking.payment_method === 'stripe'
      ? booking.amount_paid_cents ?? booking.deposit_cents_snapshot
      : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(theme) }} />
      <div className="booking-root">
        <div className="booking-page">
          <div className="booking-shell" style={{ maxWidth: '36rem' }}>
            <CancelClient
              copy={copy}
              theme={theme}
              token={token}
              alreadyUsed={alreadyUsed}
              pastCutoff={isPastCutoff}
              vars={{
                service: booking.service_name_snapshot,
                tech: booking.technician_name_snapshot,
                date: dateStr,
                time: timeStr,
                refundAmount: refundAmount > 0 ? formatCents(refundAmount) : '—',
                phone: settings.contactPhoneOverride ?? '',
                cutoffHours: settings.cancellationCutoffHours,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function notFoundShell(theme: BookingTheme | null) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(theme) }} />
      <div className="booking-root">
        <div className="booking-page">
          <div className="booking-shell" style={{ maxWidth: '32rem' }}>
            <div className="booking-card booking-card-pad" style={{ textAlign: 'center' }}>
              <h1 className="booking-heading" style={{ fontSize: '1.5rem' }}>
                Cancellation unavailable
              </h1>
              <p className="booking-helper">Please contact the salon to cancel your booking.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
