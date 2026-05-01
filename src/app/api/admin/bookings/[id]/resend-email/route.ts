// POST /api/admin/bookings/[id]/resend-email — resend the confirmation email for a booking.
//
// Used when the original webhook-triggered email failed or the customer asks for a re-send.
// Auth + Origin enforced by middleware.

import { NextResponse } from 'next/server';
import { getAdminSession } from '@/booking/lib/auth';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { sendConfirmationEmail, sendOwnerNotification } from '@/booking/lib/resend';
import { formatCents } from '@/booking/lib/templating';
import type {
  BookingCopy,
  BookingSettings,
  BookingTheme,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;

  const supabase = getSupabaseAdmin();
  const { data: booking, error } = await supabase
    .from('booking_appointments')
    .select(
      `id, status, customer_id, service_name_snapshot, technician_name_snapshot,
       service_price_cents_snapshot, deposit_cents_snapshot, service_duration_min_snapshot,
       notes, start_at, end_at, cancel_token, amount_paid_cents`,
    )
    .eq('id', id)
    .single();
  if (error || !booking) {
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
  }

  if (!booking.customer_id) {
    return NextResponse.json({ error: 'no_customer' }, { status: 409 });
  }

  const { data: customer } = await supabase
    .from('booking_customers')
    .select('name, email, phone, visit_count')
    .eq('id', booking.customer_id)
    .single();

  if (!customer?.email) {
    return NextResponse.json({ error: 'no_email_on_file' }, { status: 409 });
  }

  const [theme, copy, settings] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
  ]);
  if (!settings) {
    return NextResponse.json({ error: 'no_settings' }, { status: 503 });
  }

  const start = new Date(booking.start_at);
  const dateStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: settings.salonTimezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start);
  const timeStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: settings.salonTimezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);

  const balance = booking.service_price_cents_snapshot - booking.deposit_cents_snapshot;
  const firstName = (customer.name ?? '').split(/\s+/)[0] ?? '';
  const baseUrl = new URL(_request.url).origin;
  const cancelLink = booking.cancel_token
    ? `${baseUrl}/booking/cancel/${booking.cancel_token}`
    : '';

  const sharedVars = {
    firstName,
    customer: customer.name ?? '',
    customerPhone: customer.phone ?? '',
    customerEmail: customer.email ?? '',
    phone: customer.phone ?? '',
    service: booking.service_name_snapshot,
    serviceDuration: booking.service_duration_min_snapshot,
    tech: booking.technician_name_snapshot,
    date: dateStr,
    time: timeStr,
    deposit: formatCents(booking.deposit_cents_snapshot),
    balance: formatCents(balance),
    amount: formatCents(booking.amount_paid_cents ?? booking.deposit_cents_snapshot),
    notes: booking.notes ?? '',
    visitCount: customer.visit_count ?? 0,
    cutoffHours: settings.cancellationCutoffHours,
    cancelLink,
    adminLink: `${baseUrl}/admin/bookings/${booking.id}`,
  };

  try {
    await sendConfirmationEmail({
      to: customer.email,
      copy,
      theme,
      settings,
      vars: sharedVars,
      bookingId: booking.id,
      startUtc: booking.start_at,
      endUtc: booking.end_at,
      serviceName: booking.service_name_snapshot,
      technicianName: booking.technician_name_snapshot,
    });
    // Optional — also re-notify the owner (they may have missed the original).
    if ((settings.ownerNotificationEmails ?? []).length > 0) {
      await sendOwnerNotification({
        to: settings.ownerNotificationEmails ?? [],
        copy,
        theme,
        vars: sharedVars,
      });
    }
  } catch (err) {
    console.error('[admin resend-email] failed', booking.id, err);
    return NextResponse.json(
      { error: 'send_failed', detail: (err as Error).message },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
