// GET /api/admin/backup-csv-cron
//
// Called nightly by Railway cron. Authenticated via X-Cron-Secret header
// (compared against process.env.CRON_SECRET). Exports two CSVs:
//
//   bookings/YYYY-MM-DD.csv     — every booking_appointments row
//   customers/YYYY-MM-DD.csv    — every booking_customers row
//
// to a private Supabase Storage bucket called `booking-backups`. The bucket
// must exist and be private (no public read). Service-role can read/write.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BUCKET = 'booking-backups';

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 });
  }
  const provided = request.headers.get('x-cron-secret');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Pull everything. For very large rosters this would need pagination, but
  // a small salon won't approach Supabase's response limits any time soon.
  //
  // Deliberately excluded from the export:
  //   - cancel_token: live secret usable to cancel bookings via the public
  //     /booking/cancel/[token] route. A backup leak would let an attacker
  //     cancel every customer's appointment. Tokens are reissuable from a
  //     fresh insert, so excluding them doesn't impair restorability.
  //   - client_ip: not needed for restore; reduces PII surface in the backup.
  const BOOKING_COLUMNS =
    'id, customer_id, status, service_sanity_id, additional_service_sanity_ids, ' +
    'service_name_snapshot, service_price_cents_snapshot, service_duration_min_snapshot, ' +
    'buffer_min_snapshot, deposit_cents_snapshot, technician_sanity_id, technician_name_snapshot, ' +
    'start_at, end_at, payment_method, source, notes, ' +
    'stripe_checkout_session_id, stripe_payment_intent_id, stripe_event_id, ' +
    'amount_paid_cents, currency, ' +
    'cancel_token_used_at, cancelled_at, cancelled_by, ' +
    'review_email_sent_at, sms_reminder_sent_at, ' +
    'created_at, updated_at';

  const [bookingsRes, customersRes] = await Promise.all([
    supabase
      .from('booking_appointments')
      .select(BOOKING_COLUMNS)
      .order('created_at', { ascending: true })
      .limit(10000),
    supabase
      .from('booking_customers')
      .select('*')
      .order('first_seen_at', { ascending: true })
      .limit(10000),
  ]);

  if (bookingsRes.error || customersRes.error) {
    console.error('[backup-cron] query failed', bookingsRes.error, customersRes.error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const bookingsCsv = toCsv((bookingsRes.data ?? []) as unknown as Array<Record<string, unknown>>);
  const customersCsv = toCsv((customersRes.data ?? []) as unknown as Array<Record<string, unknown>>);

  // Best-effort uploads. If the bucket doesn't exist the upload fails — we
  // surface the error in the response so cron run output makes it visible.
  const upBookings = await supabase.storage
    .from(BUCKET)
    .upload(`bookings/${today}.csv`, bookingsCsv, {
      contentType: 'text/csv',
      upsert: true,
    });
  const upCustomers = await supabase.storage
    .from(BUCKET)
    .upload(`customers/${today}.csv`, customersCsv, {
      contentType: 'text/csv',
      upsert: true,
    });

  if (upBookings.error || upCustomers.error) {
    console.error('[backup-cron] upload failed', upBookings.error, upCustomers.error);
    return NextResponse.json(
      {
        error: 'upload_failed',
        bookings: upBookings.error?.message ?? null,
        customers: upCustomers.error?.message ?? null,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    date: today,
    bookings: bookingsRes.data?.length ?? 0,
    customers: customersRes.data?.length ?? 0,
  });
}

/** Generic CSV serializer. Quotes everything, escapes embedded quotes. */
function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set()),
  );
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    // Excel/Sheets execute leading =, +, -, @ as formulas on CSV import. Even
    // when the cell is quoted, the formula still evaluates. Prefix with a
    // single quote so the cell renders as text. CSVs opened in plain text
    // editors will see the leading apostrophe — acceptable trade.
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}
