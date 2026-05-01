// GET /api/admin/expire-pending-cron
//
// Called by Railway cron service hourly (or any external scheduler).
// Authenticated via X-Cron-Secret header (compared against process.env.CRON_SECRET).
//
// Marks any pending_payment booking row older than 1 hour as 'expired'.
// (The availability calc uses lazy expiry too — this just keeps the table tidy.)

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EXPIRY_MARGIN_MINUTES = 60; // Safety margin beyond pendingPaymentTtlMinutes.

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
  const cutoffIso = new Date(Date.now() - EXPIRY_MARGIN_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('booking_appointments')
    .update({ status: 'expired' })
    .eq('status', 'pending_payment')
    .lt('created_at', cutoffIso)
    .select('id');

  if (error) {
    console.error('[cron expire-pending] failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expired: data?.length ?? 0 });
}
