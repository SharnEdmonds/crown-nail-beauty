// POST /api/admin/bookings/[id]/reschedule
//
// Owner picks a new date / time / technician for an existing booking. The booking row
// is updated in place (start_at, end_at, technician_*). Stripe payment intent stays
// attached — no refund, no recharge. Customer is emailed with old + new times.
//
// Critical safety:
//   - The exclusion constraint on booking_appointments rejects any UPDATE that would
//     create a new overlap with an existing booking (race-safe).
//   - Re-validate the requested slot via getAvailableSlots (catches stale UI).
//   - Append-only audit row in booking_reschedule_log on every successful change.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
  BOOKING_SERVICES_BY_IDS_QUERY,
  TECHNICIANS_QUERY,
} from '@/booking/lib/queries';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getAdminSession } from '@/booking/lib/auth';
import { getClientIp } from '@/booking/lib/rate-limit';
import { getAvailableSlots } from '@/booking/lib/availability';
import { sendRescheduleNotification } from '@/booking/lib/resend';
import type {
  BookingCopy,
  BookingService,
  BookingSettings,
  BookingTheme,
  Technician,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Ctx {
  params: Promise<{ id: string }>;
}

const Body = z.object({
  newTechnicianId: z.string().min(1),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newStartUtc: z.string().min(10),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request, ctx: Ctx) {
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

  // Load existing booking — confirm it's reschedulable.
  const { data: booking, error: bErr } = await supabase
    .from('booking_appointments')
    .select(
      `id, status, customer_id, service_sanity_id, additional_service_sanity_ids,
       service_name_snapshot, technician_sanity_id, technician_name_snapshot,
       start_at, end_at`,
    )
    .eq('id', id)
    .single();
  if (bErr || !booking) {
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
  }
  // Only confirmed bookings can be rescheduled. Pending bookings are mid-payment;
  // moving them while the customer is checking out would be confusing and we don't
  // yet have the customer's email persisted (it lands on the booking_customers row
  // only after the Stripe webhook fires). If a pending booking needs to change,
  // cancel it and create a new one.
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'not_reschedulable' }, { status: 409 });
  }

  // Load services + tech + settings for availability validation
  const allServiceIds = [
    booking.service_sanity_id,
    ...((booking.additional_service_sanity_ids as string[] | undefined) ?? []),
  ];

  const [services, settings, allTechs] = await Promise.all([
    sanityClient.fetch<BookingService[]>(BOOKING_SERVICES_BY_IDS_QUERY, {
      ids: allServiceIds,
    }),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
  ]);

  if (services.length !== allServiceIds.length || services.some((s) => !s.isActive)) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 400 });
  }
  if (!settings) {
    return NextResponse.json({ error: 'no_settings' }, { status: 503 });
  }

  const tech = allTechs.find((t) => t._id === body.newTechnicianId);
  if (!tech) return NextResponse.json({ error: 'tech_not_found' }, { status: 400 });
  const techServiceIds = (tech.services as unknown as string[] | undefined) ?? [];
  if (!allServiceIds.every((sid) => techServiceIds.includes(sid))) {
    return NextResponse.json({ error: 'tech_not_qualified' }, { status: 400 });
  }

  // Validate the new slot is actually available. Excluding the booking being rescheduled
  // from the conflict set so it doesn't block itself out of its current slot or any slot
  // overlapping it. The EXCLUDE constraint at UPDATE time still catches conflicts with
  // OTHER bookings.
  const slots = await getAvailableSlots({
    services,
    technicians: [tech],
    settings,
    date: body.newDate,
    excludeBookingId: booking.id,
  });
  const matching = slots.find((s) => s.startUtc === body.newStartUtc);
  if (!matching) {
    return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 });
  }

  // Capture old values for audit
  const oldStartAt = booking.start_at;
  const oldEndAt = booking.end_at;
  const oldTechId = booking.technician_sanity_id;

  // Update booking row. The EXCLUDE constraint will reject if another booking
  // overlaps in the new slot.
  const { error: updErr } = await supabase
    .from('booking_appointments')
    .update({
      start_at: matching.startUtc,
      end_at: matching.endUtc,
      technician_sanity_id: tech._id,
      technician_name_snapshot: tech.name,
    })
    .eq('id', booking.id);

  if (updErr) {
    if (updErr.code === '23P01' || /exclusion/i.test(updErr.message)) {
      return NextResponse.json({ error: 'slot_just_taken' }, { status: 409 });
    }
    console.error('[admin reschedule] update failed', updErr);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  // Audit row
  await supabase.from('booking_reschedule_log').insert({
    booking_id: booking.id,
    admin_email: session.email,
    admin_ip: getClientIp(request) === 'unknown' ? null : getClientIp(request),
    old_start_at: oldStartAt,
    old_end_at: oldEndAt,
    old_technician_sanity_id: oldTechId,
    new_start_at: matching.startUtc,
    new_end_at: matching.endUtc,
    new_technician_sanity_id: tech._id,
    reason: body.reason ?? null,
  });

  // Best-effort notification
  if (booking.customer_id) {
    try {
      const [theme, copy] = await Promise.all([
        sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
        sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
      ]);
      const { data: customer } = await supabase
        .from('booking_customers')
        .select('name, email')
        .eq('id', booking.customer_id)
        .single();
      if (customer?.email) {
        const fmtDate = (iso: string) =>
          new Intl.DateTimeFormat('en-NZ', {
            timeZone: settings.salonTimezone,
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date(iso));
        const fmtTime = (iso: string) =>
          new Intl.DateTimeFormat('en-NZ', {
            timeZone: settings.salonTimezone,
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date(iso));
        const firstName = (customer.name ?? '').split(/\s+/)[0] ?? '';

        await sendRescheduleNotification({
          to: customer.email,
          copy,
          theme,
          vars: {
            firstName,
            service: booking.service_name_snapshot,
            oldDate: fmtDate(oldStartAt),
            oldTime: fmtTime(oldStartAt),
            newDate: fmtDate(matching.startUtc),
            newTime: fmtTime(matching.startUtc),
            tech: tech.name,
            phone: settings.contactPhoneOverride ?? '',
          },
        });
      }
    } catch (err) {
      console.warn('[admin reschedule] email send failed (non-fatal)', err);
    }
  }

  return NextResponse.json({ ok: true });
}
