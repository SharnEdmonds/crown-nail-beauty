// POST /api/admin/cancel — cancel without refund (deposit retained).
//
// Auth + Origin check enforced by middleware. Confirmation text must equal "CANCEL".

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getAdminSession } from '@/booking/lib/auth';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { sendCancellationEmail } from '@/booking/lib/resend';
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

export async function POST(request: Request) {
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
  if (body.confirmationText.trim().toUpperCase() !== 'CANCEL') {
    return NextResponse.json({ error: 'confirmation_mismatch' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: booking, error } = await supabase
    .from('booking_appointments')
    .select('id, status, customer_id, service_name_snapshot, start_at')
    .eq('id', body.bookingId)
    .single();
  if (error || !booking) {
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
  }
  if (booking.status !== 'confirmed' && booking.status !== 'pending_payment') {
    return NextResponse.json({ error: 'not_cancellable' }, { status: 409 });
  }

  await supabase
    .from('booking_appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'admin',
    })
    .eq('id', booking.id);

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
        .select('name, email')
        .eq('id', booking.customer_id)
        .single();
      if (c?.email && settings) {
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
          withRefund: false,
          vars: {
            firstName,
            service: booking.service_name_snapshot,
            date: dateStr,
          },
        });
      }
    }
  } catch (err) {
    console.warn('[admin cancel] email send failed (non-fatal)', err);
  }

  return NextResponse.json({ ok: true });
}
