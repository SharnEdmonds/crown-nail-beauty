// GET /api/admin/review-email-cron
//
// Hourly cron — sends review-request emails to customers whose appointment was
// roughly 2 days ago. Idempotent via the review_email_sent_at column.
//
// Window:  start_at between (now - 56h) and (now - 48h)
// (8-hour window so a missed cron run doesn't permanently skip anyone)

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { sendReviewRequestEmail } from '@/booking/lib/resend';
import type {
  BookingCopy,
  BookingSettings,
  BookingTheme,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WINDOW_START_HOURS_AGO = 56;
const WINDOW_END_HOURS_AGO = 48;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });
  const provided = request.headers.get('x-cron-secret');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const now = Date.now();
  const fromIso = new Date(now - WINDOW_START_HOURS_AGO * 60 * 60 * 1000).toISOString();
  const toIso = new Date(now - WINDOW_END_HOURS_AGO * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdmin();
  const { data: candidates, error } = await supabase
    .from('booking_appointments')
    .select(
      'id, customer_id, service_name_snapshot, technician_name_snapshot, start_at',
    )
    .eq('status', 'confirmed')
    .is('review_email_sent_at', null)
    .gte('start_at', fromIso)
    .lt('start_at', toIso);

  if (error) {
    console.error('[review-cron] query failed', error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const list = candidates ?? [];
  if (list.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const [theme, copy, settings] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
  ]);
  if (!settings) return NextResponse.json({ error: 'no_settings' }, { status: 503 });
  const reviewLink = (copy?.reviewLinkUrl ?? '').trim();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const booking of list) {
    if (!booking.customer_id) {
      skipped += 1;
      continue;
    }
    const { data: customer } = await supabase
      .from('booking_customers')
      .select('name, email, is_redacted')
      .eq('id', booking.customer_id)
      .single();
    if (!customer || customer.is_redacted || !customer.email) {
      // Mark as sent anyway so we don't keep retrying redacted/no-email customers.
      await supabase
        .from('booking_appointments')
        .update({ review_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id);
      skipped += 1;
      continue;
    }
    const firstName = (customer.name ?? '').split(/\s+/)[0] ?? '';
    // Claim the booking BEFORE sending so a Resend transient (or our own crash
    // mid-send) can't cause duplicate delivery on the next hourly tick. Failure mode
    // flips from "multi-send" to "no-send" — operator can clear review_email_sent_at
    // manually for any specific row to retry.
    const { count: claimed, error: claimErr } = await supabase
      .from('booking_appointments')
      .update({ review_email_sent_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', booking.id)
      .is('review_email_sent_at', null);
    if (claimErr || (claimed ?? 0) === 0) {
      // Either DB error, or a parallel cron beat us to it.
      skipped += 1;
      continue;
    }
    try {
      await sendReviewRequestEmail({
        to: customer.email,
        copy,
        theme,
        vars: {
          firstName,
          service: booking.service_name_snapshot,
          tech: booking.technician_name_snapshot,
          reviewLink,
        },
      });
      sent += 1;
    } catch (err) {
      console.error('[review-cron] send failed (claim retained)', booking.id, err);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed });
}
