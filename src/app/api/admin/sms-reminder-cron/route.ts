// GET /api/admin/sms-reminder-cron
//
// Hourly cron — sends SMS reminders to customers whose appointment is roughly
// 24h away. Idempotent via the sms_reminder_sent_at column. Skips if Twilio is
// not configured or the salon disabled SMS in Booking Settings.
//
// Window:  start_at between (now + 23h) and (now + 25h)

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
} from '@/booking/lib/queries';
import { getTwilio, getTwilioFromNumber, toE164NZ } from '@/booking/lib/twilio';
import { renderTemplate } from '@/booking/lib/templating';
import { COPY_DEFAULTS } from '@/booking/lib/copy-defaults';
import type { BookingCopy, BookingSettings } from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WINDOW_START_HOURS_AHEAD = 23;
const WINDOW_END_HOURS_AHEAD = 25;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });
  const provided = request.headers.get('x-cron-secret');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const settings = await sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY);
  if (!settings) return NextResponse.json({ error: 'no_settings' }, { status: 503 });
  if (!settings.smsRemindersEnabled) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'disabled_in_settings' });
  }

  const twilio = getTwilio();
  const fromNumber = getTwilioFromNumber();
  if (!twilio || !fromNumber) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'twilio_not_configured' });
  }

  const now = Date.now();
  const fromIso = new Date(now + WINDOW_START_HOURS_AHEAD * 60 * 60 * 1000).toISOString();
  const toIso = new Date(now + WINDOW_END_HOURS_AHEAD * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdmin();
  const { data: candidates, error } = await supabase
    .from('booking_appointments')
    .select(
      'id, customer_id, service_name_snapshot, technician_name_snapshot, start_at',
    )
    .eq('status', 'confirmed')
    .is('sms_reminder_sent_at', null)
    .gte('start_at', fromIso)
    .lt('start_at', toIso);

  if (error) {
    console.error('[sms-cron] query failed', error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const list = candidates ?? [];
  if (list.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const copy = await sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY);
  const tz = settings.salonTimezone;
  const template = (copy?.smsReminderTemplate ?? COPY_DEFAULTS.smsReminderTemplate) || '';

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
      .select('name, phone, is_redacted')
      .eq('id', booking.customer_id)
      .single();
    if (!customer || customer.is_redacted || !customer.phone) {
      await supabase
        .from('booking_appointments')
        .update({ sms_reminder_sent_at: new Date().toISOString() })
        .eq('id', booking.id);
      skipped += 1;
      continue;
    }

    const e164 = toE164NZ(customer.phone);
    if (!e164) {
      // Mark as sent so we don't retry forever on an unparseable number.
      await supabase
        .from('booking_appointments')
        .update({ sms_reminder_sent_at: new Date().toISOString() })
        .eq('id', booking.id);
      console.warn('[sms-cron] unparseable phone', customer.phone);
      skipped += 1;
      continue;
    }

    const start = new Date(booking.start_at);
    const date = new Intl.DateTimeFormat('en-NZ', {
      timeZone: tz,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(start);
    const time = new Intl.DateTimeFormat('en-NZ', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    }).format(start);
    const firstName = (customer.name ?? '').split(/\s+/)[0] ?? '';

    const body = renderTemplate(
      template,
      {
        firstName,
        service: booking.service_name_snapshot,
        tech: booking.technician_name_snapshot,
        date,
        time,
      },
      'smsReminderTemplate',
    );

    // Claim the booking BEFORE sending so a Twilio transient (or our own crash
    // mid-send) can't cause duplicate SMS on the next tick. Failure mode flips from
    // "multi-send" to "no-send" — operator can clear sms_reminder_sent_at manually
    // for any specific row to retry.
    const { count: claimed, error: claimErr } = await supabase
      .from('booking_appointments')
      .update({ sms_reminder_sent_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', booking.id)
      .is('sms_reminder_sent_at', null);
    if (claimErr || (claimed ?? 0) === 0) {
      skipped += 1;
      continue;
    }

    try {
      await twilio.messages.create({
        from: fromNumber,
        to: e164,
        body,
      });
      sent += 1;
    } catch (err) {
      console.error('[sms-cron] twilio send failed (claim retained)', booking.id, err);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed });
}
