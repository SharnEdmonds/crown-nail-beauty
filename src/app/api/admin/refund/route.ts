// POST /api/admin/refund
//
// Admin-initiated refund. Auth + allowlist + Origin enforced by middleware.
//
// Process:
//   1. Validate body
//   2. Load booking
//   3. Re-validate confirmation text (case + diacritic insensitive against customer.first_name)
//   4. Stripe Refund FIRST with Idempotency-Key=refund-{bookingId}
//      → on success: mark booking cancelled + log refund + send cancellation email
//      → on failure: leave booking unchanged
//   5. Catch duplicate-refund error → treat as success
//
// Enforces: only confirmed Stripe-paid bookings can be refunded.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import type Stripe from 'stripe';
import { getStripe } from '@/booking/lib/stripe';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getAdminSession } from '@/booking/lib/auth';
import { getClientIp } from '@/booking/lib/rate-limit';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { sendCancellationEmail } from '@/booking/lib/resend';
import { formatCents } from '@/booking/lib/templating';
import type {
  BookingCopy,
  BookingSettings,
  BookingTheme,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  bookingId: z.string().uuid(),
  confirmationText: z.string().min(1).max(80),
  reason: z.string().max(80).optional(),
});

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

export async function POST(request: Request) {
  // Middleware already gated this; double-check belt-and-braces.
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_request', detail: (err as Error).message },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: booking, error: bErr } = await supabase
    .from('booking_appointments')
    .select(
      `id, status, customer_id, payment_method, stripe_payment_intent_id,
       deposit_cents_snapshot, amount_paid_cents, currency, service_name_snapshot,
       start_at`,
    )
    .eq('id', body.bookingId)
    .single();
  if (bErr || !booking) {
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
  }
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'not_refundable_status' }, { status: 409 });
  }
  if (booking.payment_method !== 'stripe' || !booking.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'not_stripe_paid' }, { status: 409 });
  }

  // Customer first-name match (server re-validation)
  let customerFirstName = '';
  if (booking.customer_id) {
    const { data: c } = await supabase
      .from('booking_customers')
      .select('name, email')
      .eq('id', booking.customer_id)
      .single();
    if (c) customerFirstName = (c.name ?? '').split(/\s+/)[0] ?? '';
  }
  if (!customerFirstName) {
    return NextResponse.json({ error: 'no_customer' }, { status: 409 });
  }
  if (normalize(body.confirmationText) !== normalize(customerFirstName)) {
    return NextResponse.json({ error: 'confirmation_mismatch' }, { status: 400 });
  }

  // Stripe refund FIRST with idempotency key
  const stripe = getStripe();
  const refundAmount = booking.amount_paid_cents ?? booking.deposit_cents_snapshot;
  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create(
      {
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundAmount,
        reason: 'requested_by_customer',
      },
      { idempotencyKey: `refund-${booking.id}` },
    );
  } catch (err) {
    const sErr = err as { message?: string; code?: string };
    // Stripe returns 'charge_already_refunded' if the same charge has already been
    // refunded — treat as a success (idempotency).
    if (sErr.code === 'charge_already_refunded') {
      // Look up most recent refund for this PI
      const list = await stripe.refunds.list({
        payment_intent: booking.stripe_payment_intent_id,
        limit: 1,
      });
      refund = list.data[0];
    } else {
      console.error('[admin refund] stripe failed', sErr.message, sErr.code);
      return NextResponse.json(
        { error: 'stripe_refund_failed', detail: sErr.message ?? 'unknown' },
        { status: 502 },
      );
    }
  }

  // Mark booking cancelled + log refund
  const { error: updErr } = await supabase
    .from('booking_appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'admin',
    })
    .eq('id', booking.id)
    .eq('status', 'confirmed');
  if (updErr) {
    console.error('[admin refund] failed to mark cancelled after refund', updErr);
  }

  await supabase.from('booking_refund_log').insert({
    booking_id: booking.id,
    admin_email: session.email,
    admin_ip: getClientIp(request) === 'unknown' ? null : getClientIp(request),
    amount_cents: refundAmount,
    currency: booking.currency,
    stripe_refund_id: refund.id,
    reason: body.reason ?? null,
    confirmation_text_used: body.confirmationText,
  });

  // Best-effort email
  try {
    const [theme, copy, settings] = await Promise.all([
      sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
      sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
      sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    ]);

    if (booking.customer_id) {
      const { data: c } = await supabase
        .from('booking_customers')
        .select('email')
        .eq('id', booking.customer_id)
        .single();
      if (c?.email && settings) {
        const dateStr = new Intl.DateTimeFormat('en-NZ', {
          timeZone: settings.salonTimezone,
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(new Date(booking.start_at));
        await sendCancellationEmail({
          to: c.email,
          copy,
          theme,
          withRefund: true,
          vars: {
            firstName: customerFirstName,
            refundAmount: formatCents(refundAmount),
            service: booking.service_name_snapshot,
            date: dateStr,
          },
        });
      }
    }
  } catch (err) {
    console.warn('[admin refund] email send failed (non-fatal)', err);
  }

  return NextResponse.json({ ok: true, refundId: refund.id });
}
