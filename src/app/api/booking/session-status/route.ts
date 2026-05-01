// GET /api/booking/session-status?session_id=cs_test_...
//
// Used by the success page to poll for booking confirmation while waiting for
// the Stripe webhook to fire. Returns minimal data — never PII.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId || sessionId.length < 5) {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('booking_appointments')
    .select('status')
    .eq('stripe_checkout_session_id', sessionId)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: 'unknown' });
  }
  return NextResponse.json({ status: data.status });
}
