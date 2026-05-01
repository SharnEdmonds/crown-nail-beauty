// PATCH /api/admin/bookings/[id]/edit
//
// Lightweight admin edits that DON'T require availability re-validation:
//   - notes (free-text customer notes)
//   - technicianId (swap to a different qualified tech, same time)
//
// For time changes, use the reschedule endpoint instead — it has its own
// availability + audit logic.
//
// Auth + Origin enforced by proxy.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getAdminSession } from '@/booking/lib/auth';
import { client as sanityClient } from '@/sanity/lib/client';
import { TECHNICIANS_QUERY } from '@/booking/lib/queries';
import type { Technician } from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ id: string }>;
}

const Body = z
  .object({
    notes: z.string().max(2000).nullable().optional(),
    technicianId: z.string().min(1).optional(),
  })
  .refine(
    (b) => b.notes !== undefined || b.technicianId !== undefined,
    { message: 'Provide at least one field to update' },
  );

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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

  const supabase = getSupabaseAdmin();

  const { data: booking, error: bErr } = await supabase
    .from('booking_appointments')
    .select(
      'id, status, service_sanity_id, additional_service_sanity_ids, technician_sanity_id, start_at, end_at',
    )
    .eq('id', id)
    .single();
  if (bErr || !booking) {
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
  }
  if (!['confirmed', 'pending_payment'].includes(booking.status)) {
    return NextResponse.json({ error: 'not_editable' }, { status: 409 });
  }

  const updates: Record<string, unknown> = {};

  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }

  if (body.technicianId !== undefined && body.technicianId !== booking.technician_sanity_id) {
    // Validate the new tech can perform every service on this booking.
    const allServiceIds = [
      booking.service_sanity_id,
      ...((booking.additional_service_sanity_ids as string[] | undefined) ?? []),
    ];
    const techs = await sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY);
    const tech = techs.find((t) => t._id === body.technicianId);
    if (!tech) return NextResponse.json({ error: 'tech_not_found' }, { status: 400 });
    const techServiceIds = (tech.services as unknown as string[] | undefined) ?? [];
    if (!allServiceIds.every((sid) => techServiceIds.includes(sid))) {
      return NextResponse.json({ error: 'tech_not_qualified' }, { status: 400 });
    }
    updates.technician_sanity_id = tech._id;
    updates.technician_name_snapshot = tech.name;
  }

  if (Object.keys(updates).length === 0) {
    // Notes-only edit where notes are unchanged, or tech-only edit to same tech.
    return NextResponse.json({ ok: true, noop: true });
  }

  const { error: updErr } = await supabase
    .from('booking_appointments')
    .update(updates)
    .eq('id', booking.id);

  if (updErr) {
    if (updErr.code === '23P01' || /exclusion/i.test(updErr.message)) {
      // Tech change collided with another booking already in that slot for the new tech.
      return NextResponse.json({ error: 'slot_just_taken' }, { status: 409 });
    }
    console.error('[admin booking edit] update failed', updErr);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
