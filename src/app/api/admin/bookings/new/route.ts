// POST /api/admin/bookings/new — create a manual booking (phone-in / walk-in / comp).
//
// Bypasses Stripe Checkout. Sets payment_method to 'in_store' or 'comp', source to
// 'admin_manual', status straight to 'confirmed'. Same exclusion constraint applies
// so manual bookings can't conflict with online bookings.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_SERVICES_BY_IDS_QUERY,
  BOOKING_SETTINGS_QUERY,
  TECHNICIANS_QUERY,
} from '@/booking/lib/queries';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getAdminSession } from '@/booking/lib/auth';
import { buildSnapshot, orderServicesByIds } from '@/booking/lib/snapshot';
import { getAvailableSlots } from '@/booking/lib/availability';
import type {
  BookingService,
  BookingSettings,
  Technician,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PHONE_REGEX = /^[\d\s+\-()]{6,20}$/;
const E164_NORMALIZE = /[^\d+]/g;

const Body = z.object({
  // 1-3 service ids. Backwards compatible by accepting array (single = one-element).
  serviceIds: z.array(z.string().min(1)).min(1).max(3),
  technicianId: z.string().min(1), // must be a specific tech (no 'any' for admin manual)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startUtc: z.string().min(10),
  paymentMethod: z.enum(['in_store', 'comp']),
  customer: z.object({
    name: z.string().min(1).max(80),
    phone: z.string().regex(PHONE_REGEX),
    email: z.string().email().max(120).optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
  }),
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

  const [services, settings, allTechs] = await Promise.all([
    sanityClient.fetch<BookingService[]>(BOOKING_SERVICES_BY_IDS_QUERY, {
      ids: body.serviceIds,
    }),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
  ]);
  if (services.length !== body.serviceIds.length) {
    return NextResponse.json({ error: 'service_not_found' }, { status: 400 });
  }
  if (!settings) return NextResponse.json({ error: 'no_settings' }, { status: 503 });

  const tech = allTechs.find((t) => t._id === body.technicianId);
  if (!tech) return NextResponse.json({ error: 'tech_not_found' }, { status: 400 });
  // Tech qualified iff they perform every selected service.
  const techServiceIds = (tech.services as unknown as string[] | undefined) ?? [];
  if (!body.serviceIds.every((sid) => techServiceIds.includes(sid))) {
    return NextResponse.json({ error: 'tech_not_qualified' }, { status: 400 });
  }

  // Re-compute availability — admin still respects schedule + existing bookings.
  // Services in user-selection order for trailing-buffer consistency with the snapshot.
  const orderedServices = orderServicesByIds(body.serviceIds, services);
  const slots = await getAvailableSlots({
    services: orderedServices,
    technicians: [tech],
    settings,
    date: body.date,
  });
  const matchingSlot = slots.find((s) => s.startUtc === body.startUtc);
  if (!matchingSlot) {
    return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 });
  }

  const phoneNormalized = body.customer.phone.replace(E164_NORMALIZE, '').slice(0, 20);
  const supabase = getSupabaseAdmin();

  // Upsert customer (do NOT bump visit_count yet — wait until insert succeeds).
  const { data: cust, error: custErr } = await supabase
    .from('booking_customers')
    .upsert(
      {
        phone: phoneNormalized,
        email: body.customer.email || null,
        name: body.customer.name,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'phone' },
    )
    .select('id, visit_count')
    .single();
  if (custErr || !cust) {
    return NextResponse.json({ error: 'customer_upsert_failed' }, { status: 500 });
  }

  const snapshot = buildSnapshot(orderedServices, tech);
  const { data: booking, error: insErr } = await supabase
    .from('booking_appointments')
    .insert({
      status: 'confirmed',
      ...snapshot,
      start_at: matchingSlot.startUtc,
      end_at: matchingSlot.endUtc,
      payment_method: body.paymentMethod,
      source: 'admin_manual',
      notes: body.customer.notes || null,
      currency: 'nzd',
      customer_id: cust.id,
    })
    .select('id')
    .single();

  if (insErr) {
    if (insErr.code === '23P01' || /exclusion/i.test(insErr.message)) {
      return NextResponse.json({ error: 'slot_just_taken' }, { status: 409 });
    }
    console.error('[admin manual] insert failed', insErr);
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  // Bump visit count atomically AFTER successful insert (avoids ghost-visits when
  // the slot was taken by a race or other failure).
  await supabase.rpc('booking_increment_visit', { p_customer_id: cust.id }).then(
    (res) => {
      if (res.error) {
        console.warn('[admin manual] visit_count rpc failed (non-fatal)', res.error);
      }
    },
  );

  return NextResponse.json({ ok: true, bookingId: booking.id });
}
