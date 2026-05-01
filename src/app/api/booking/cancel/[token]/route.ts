// POST /api/booking/cancel/[token] — customer self-cancel via tokenized link.
//
// Security:
//   - Token lookup is via UNIQUE index (constant-time at DB level).
//   - One-shot: cancel_token_used_at marks token used; reuse rejected with generic error.
//   - Cutoff: cancellation only allowed >= settings.cancellationCutoffHours before start.
//   - Stripe Refund FIRST (idempotency-keyed) → only mark booking cancelled on success.
//   - Generic errors only — never reveal whether the token exists / is valid.

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/booking/lib/stripe';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
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

interface Ctx {
  params: Promise<{ token: string }>;
}

export async function POST(_request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'invalid' }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const settings = await sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY);
  if (!settings) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const { data: booking, error } = await supabase
    .from('booking_appointments')
    .select(
      `id, status, customer_id, payment_method, stripe_payment_intent_id,
       deposit_cents_snapshot, amount_paid_cents, currency, service_name_snapshot,
       start_at, cancel_token_used_at`,
    )
    .eq('cancel_token', token)
    .single();
  if (error || !booking) {
    // Generic error — do not leak whether token exists.
    return NextResponse.json({ error: 'unavailable' }, { status: 410 });
  }

  if (booking.cancel_token_used_at) {
    return NextResponse.json({ error: 'already_used' }, { status: 410 });
  }
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'not_cancellable' }, { status: 409 });
  }

  const cutoffMs = settings.cancellationCutoffHours * 60 * 60 * 1000;
  if (new Date(booking.start_at).getTime() - Date.now() < cutoffMs) {
    return NextResponse.json({ error: 'past_cutoff' }, { status: 409 });
  }

  // Stripe refund first
  let refundAmount = 0;
  if (booking.payment_method === 'stripe' && booking.stripe_payment_intent_id) {
    refundAmount = booking.amount_paid_cents ?? booking.deposit_cents_snapshot;
    try {
      await getStripe().refunds.create(
        {
          payment_intent: booking.stripe_payment_intent_id,
          amount: refundAmount,
          reason: 'requested_by_customer',
        },
        { idempotencyKey: `refund-${booking.id}` },
      );
    } catch (err) {
      const sErr = err as { code?: string; message?: string };
      if (sErr.code !== 'charge_already_refunded') {
        console.error('[self-cancel] stripe refund failed', sErr.code, sErr.message);
        return NextResponse.json({ error: 'refund_failed' }, { status: 502 });
      }
    }
  }

  // Mark booking cancelled + token used
  const { error: updErr } = await supabase
    .from('booking_appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'customer',
      cancel_token_used_at: new Date().toISOString(),
    })
    .eq('id', booking.id)
    .eq('status', 'confirmed');
  if (updErr) {
    console.error('[self-cancel] failed to mark cancelled', updErr);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  // Best-effort email
  try {
    const [theme, copy] = await Promise.all([
      sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
      sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
    ]);
    if (booking.customer_id) {
      const { data: c } = await supabase
        .from('booking_customers')
        .select('name, email')
        .eq('id', booking.customer_id)
        .single();
      if (c?.email) {
        const firstName = (c.name ?? '').split(/\s+/)[0] ?? '';
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
          withRefund: refundAmount > 0,
          vars: {
            firstName,
            refundAmount: formatCents(refundAmount),
            service: booking.service_name_snapshot,
            date: dateStr,
          },
        });
      }
    }
  } catch (err) {
    console.warn('[self-cancel] email send failed (non-fatal)', err);
  }

  return NextResponse.json({ ok: true, refundAmount });
}
