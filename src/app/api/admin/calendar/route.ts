// GET /api/admin/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Returns confirmed + pending bookings within the date range, with a tiny customer
// shape attached for hover labels. Auth is enforced by the proxy at the edge AND
// re-checked here as defence-in-depth (if the matcher ever drifts, this route still
// refuses unauthenticated reads of customer PII).

import { NextResponse } from 'next/server';
import { fromZonedTime } from 'date-fns-tz';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getAdminSession } from '@/booking/lib/auth';
import { client as sanityClient } from '@/sanity/lib/client';
import { BOOKING_SETTINGS_QUERY } from '@/booking/lib/queries';
import type { BookingSettings } from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: 'bad_range' }, { status: 400 });
  }

  // Interpret from/to as wall-clock dates in the salon's timezone so a booking
  // showing locally on day X is fetched when the admin asks for day X — even if
  // its UTC timestamp falls on an adjacent calendar day.
  const settings = await sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY);
  const tz = settings?.salonTimezone ?? 'UTC';
  const fromIso = fromZonedTime(`${from}T00:00:00`, tz).toISOString();
  // `to` is inclusive — convert to the start of the day AFTER `to` and use a `<` filter.
  const toExclusive = addDaysToIsoDate(to, 1);
  const toIso = fromZonedTime(`${toExclusive}T00:00:00`, tz).toISOString();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('booking_appointments')
    .select(
      `id, status, start_at, end_at, technician_sanity_id, technician_name_snapshot,
       service_name_snapshot, payment_method,
       customer_id, booking_customers!left(name, phone)`,
    )
    .in('status', ['confirmed', 'pending_payment'])
    .gte('start_at', fromIso)
    .lt('start_at', toIso)
    .order('start_at', { ascending: true });

  if (error) {
    console.error('[admin calendar] query failed', error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const bookings = (data ?? []).map((row) => {
    const cust = (row.booking_customers as unknown as { name?: string; phone?: string } | null) ?? null;
    return {
      id: row.id,
      status: row.status,
      startUtc: row.start_at,
      endUtc: row.end_at,
      technicianId: row.technician_sanity_id,
      technicianName: row.technician_name_snapshot,
      serviceName: row.service_name_snapshot,
      paymentMethod: row.payment_method,
      customerName: cust?.name ?? null,
    };
  });

  return NextResponse.json({ bookings });
}

function addDaysToIsoDate(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
