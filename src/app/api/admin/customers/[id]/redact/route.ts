// POST /api/admin/customers/[id]/redact
//
// Privacy Act 2020 — "right to deletion". Sets is_redacted=true and overwrites
// the customer's PII columns. Booking history is preserved (financial record),
// but service-snapshot fields on the booking row already contain the customer's
// name? No — bookings don't snapshot the customer name (that's stored on
// booking_customers only). So redaction is a single-row UPDATE.
//
// Idempotent: redacting an already-redacted customer is a no-op.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getAdminSession } from '@/booking/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ id: string }>;
}

const Body = z.object({
  confirmationText: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_request', detail: (err as Error).message },
      { status: 400 },
    );
  }

  if (body.confirmationText.trim().toUpperCase() !== 'REDACT') {
    return NextResponse.json({ error: 'confirmation_mismatch' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('booking_customers')
    .update({
      name: 'REDACTED',
      // Phone has a UNIQUE constraint — replace with a unique synthetic value
      // so future bookings from a different real number can still upsert.
      phone: `redacted-${id}`,
      email: null,
      is_redacted: true,
    })
    .eq('id', id);

  if (error) {
    console.error('[admin redact] update failed', error);
    return NextResponse.json(
      { error: 'update_failed', detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
