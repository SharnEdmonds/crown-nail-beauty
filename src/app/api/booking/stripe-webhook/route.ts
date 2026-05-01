// POST /api/booking/stripe-webhook
//
// CRITICAL SECURITY POINTS — this is the only path that marks a booking 'confirmed':
//   - Verify Stripe-Signature on the RAW request body. If verification fails → 400.
//   - Read body via request.text() (not request.json()) — Stripe signature hashes exact bytes.
//   - Idempotent via UNIQUE (stripe_event_id) on booking_appointments + booking_webhook_log.
//   - Always return 200/400 with opaque body. Never leak stack traces to Stripe.
//   - Stripe will retry on non-2xx for up to 3 days — we DELIBERATELY return 200 even when
//     we recognise an event we can't act on (e.g. unknown event type), to avoid retries.
//   - DO NOT trust any payload field for security decisions — only the verified event.data.

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret } from '@/booking/lib/stripe';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { sendConfirmationEmail, sendOwnerNotification } from '@/booking/lib/resend';
import { formatCents } from '@/booking/lib/templating';
import type { BookingCopy, BookingSettings, BookingTheme } from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const E164_NORMALIZE = /[^\d+]/g;

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return new NextResponse(JSON.stringify({ error: 'missing_signature' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new NextResponse(JSON.stringify({ error: 'no_body' }), { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, getStripeWebhookSecret());
  } catch (err) {
    // Signature mismatch or replayed timestamp. Do not log payload.
    console.warn('[stripe webhook] signature verification failed');
    return new NextResponse(
      JSON.stringify({ error: 'invalid_signature', detail: (err as Error).message }),
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Always log the webhook event for forensics. UNIQUE on stripe_event_id makes this idempotent.
  const { error: logErr } = await supabase.from('booking_webhook_log').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload_summary: {
      object: event.data.object && typeof event.data.object === 'object'
        ? (event.data.object as { object?: string }).object ?? null
        : null,
    },
  });
  if (logErr) {
    if (logErr.code === '23505') {
      // Already processed — duplicate webhook delivery. Return 200; do not re-execute.
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Some other DB error. We deliberately do not retry — log and return 200 so Stripe
    // does not infinite-retry on a DB outage. Operations team is paged via separate alerts.
    console.error('[stripe webhook] failed to write webhook log', logErr);
  }

  // Process the event types we care about.
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
      // Other events (payment_intent.failed, charge.refunded, etc.) — handled by separate flows.
      default:
        // Acknowledged but no action.
        break;
    }
  } catch (err) {
    console.error('[stripe webhook] handler failed', event.type, err);
    // Mark log row as failed for forensics.
    await supabase
      .from('booking_webhook_log')
      .update({ processed_ok: false })
      .eq('stripe_event_id', event.id);
    // Return 500 so Stripe retries (transient errors recover).
    return new NextResponse(JSON.stringify({ error: 'handler_failed' }), { status: 500 });
  }

  await supabase
    .from('booking_webhook_log')
    .update({ processed_ok: true })
    .eq('stripe_event_id', event.id);

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.warn('[stripe webhook] checkout.session.completed without booking_id metadata', session.id);
    return;
  }

  if (session.payment_status !== 'paid') {
    // Should never happen for `checkout.session.completed` with payment mode, but defensive.
    console.warn('[stripe webhook] session not paid', session.id, session.payment_status);
    return;
  }

  const supabase = getSupabaseAdmin();

  // Look up booking by id. Confirms the booking_id metadata wasn't tampered.
  const { data: booking, error: bookingErr } = await supabase
    .from('booking_appointments')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    console.warn('[stripe webhook] no matching booking for', bookingId, session.id);
    return;
  }

  // If already confirmed (duplicate webhook delivery), no-op.
  if (booking.status === 'confirmed') {
    return;
  }
  if (booking.status !== 'pending_payment') {
    console.warn(
      '[stripe webhook] booking in unexpected state',
      bookingId,
      booking.status,
    );
    return;
  }

  // Verify the Stripe session matches our stored session id.
  if (booking.stripe_checkout_session_id && booking.stripe_checkout_session_id !== session.id) {
    console.error(
      '[stripe webhook] session id mismatch',
      bookingId,
      booking.stripe_checkout_session_id,
      session.id,
    );
    return;
  }

  // Upsert customer by phone.
  const phone = (session.metadata?.customer_phone ?? '').replace(E164_NORMALIZE, '').slice(0, 20);
  const customerName = session.metadata?.customer_name ?? booking.technician_name_snapshot;
  const customerEmail = session.customer_email ?? session.customer_details?.email ?? null;

  let customerId: string | null = null;
  let newVisitCount = 0;
  if (phone) {
    const { data: upserted, error: upsertErr } = await supabase
      .from('booking_customers')
      .upsert(
        {
          phone,
          email: customerEmail,
          name: customerName,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'phone' },
      )
      .select('id')
      .single();

    if (upsertErr) {
      console.error('[stripe webhook] customer upsert failed', upsertErr);
    } else {
      customerId = upserted.id;
      // Atomic increment via RPC — avoids lost updates under concurrent webhooks for
      // the same returning customer. The function returns the NEW visit count.
      const { data: incData, error: incErr } = await supabase.rpc(
        'booking_increment_visit',
        { p_customer_id: customerId },
      );
      if (incErr) {
        console.warn('[stripe webhook] visit_count rpc failed (non-fatal)', incErr);
      } else if (typeof incData === 'number') {
        newVisitCount = incData;
      }
    }
  }

  const { error: updateErr } = await supabase
    .from('booking_appointments')
    .update({
      status: 'confirmed',
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      stripe_event_id: event.id,
      amount_paid_cents: session.amount_total,
      customer_id: customerId,
    })
    .eq('id', bookingId)
    .eq('status', 'pending_payment'); // Optimistic: only update if still pending.

  if (updateErr) {
    if (updateErr.code === '23505') {
      // stripe_event_id unique violation — duplicate event, already handled.
      return;
    }
    throw updateErr;
  }

  // ── Send emails (best-effort; errors do not fail the webhook) ────
  // The booking is already confirmed in DB. Email send failures only mean the user
  // doesn't get an automatic email — the owner can resend from admin.
  try {
    await sendBookingEmails({
      bookingId,
      booking,
      session,
      customerEmail,
      customerName,
      customerPhone: phone,
      visitCount: newVisitCount,
    });
  } catch (err) {
    console.error('[stripe webhook] email send failed (non-fatal)', bookingId, err);
  }
}

async function sendBookingEmails({
  bookingId,
  booking,
  session,
  customerEmail,
  customerName,
  customerPhone,
  visitCount,
}: {
  bookingId: string;
  booking: {
    service_name_snapshot: string;
    technician_name_snapshot: string;
    service_price_cents_snapshot: number;
    deposit_cents_snapshot: number;
    service_duration_min_snapshot: number;
    notes: string | null;
    start_at: string;
    end_at: string;
    cancel_token: string | null;
  };
  session: Stripe.Checkout.Session;
  customerEmail: string | null;
  customerName: string;
  customerPhone: string;
  visitCount: number;
}) {
  const [theme, copy, settings] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
  ]);

  if (!settings) return;

  const startDate = new Date(booking.start_at);
  const dateStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: settings.salonTimezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(startDate);
  const timeStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: settings.salonTimezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(startDate);

  const balance = booking.service_price_cents_snapshot - booking.deposit_cents_snapshot;
  const firstName = customerName.split(/\s+/)[0] || customerName;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof session.success_url === 'string' ? new URL(session.success_url).origin : '');

  const cancelLink =
    booking.cancel_token && baseUrl
      ? `${baseUrl}/booking/cancel/${booking.cancel_token}`
      : '';

  const sharedVars = {
    firstName,
    customer: customerName,
    customerPhone,
    customerEmail: customerEmail ?? '',
    service: booking.service_name_snapshot,
    serviceDuration: booking.service_duration_min_snapshot,
    tech: booking.technician_name_snapshot,
    date: dateStr,
    time: timeStr,
    deposit: formatCents(booking.deposit_cents_snapshot),
    balance: formatCents(balance),
    amount: formatCents(session.amount_total ?? booking.deposit_cents_snapshot),
    notes: booking.notes ?? '',
    visitCount,
    phone: settings.contactPhoneOverride ?? '',
    cutoffHours: settings.cancellationCutoffHours,
    cancelLink,
    adminLink: baseUrl ? `${baseUrl}/admin/bookings/${bookingId}` : '',
  };

  // Customer confirmation
  if (customerEmail) {
    await sendConfirmationEmail({
      to: customerEmail,
      copy,
      theme,
      settings,
      vars: sharedVars,
      bookingId,
      startUtc: booking.start_at,
      endUtc: booking.end_at,
      serviceName: booking.service_name_snapshot,
      technicianName: booking.technician_name_snapshot,
    });
  }

  // Owner notification
  const ownerEmails = settings.ownerNotificationEmails ?? [];
  if (ownerEmails.length > 0) {
    await sendOwnerNotification({
      to: ownerEmails,
      copy,
      theme,
      vars: sharedVars,
    });
  }
}
