// POST /api/booking/create
//
// Creates a booking row with status='pending_payment', then a Stripe Checkout Session
// for the deposit. Returns the Checkout URL — the wizard redirects the customer.
//
// Security & integrity controls (in order):
//   1. Rate limit by IP (5 / 10 min)
//   2. Validate body with zod
//   3. Re-fetch service + tech from Sanity (don't trust client-supplied price/duration)
//   4. Re-compute availability (defends against client clock drift / stale UI)
//   5. Generate 256-bit cancel token
//   6. INSERT booking — exclusion constraint catches concurrent races (returns 409)
//   7. Cap pending bookings per phone at 3 (cheap query before insert)
//   8. Create Stripe Checkout Session, attach booking_id metadata
//   9. Update booking row with stripe_checkout_session_id
//  10. Return Checkout URL

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_SERVICES_BY_IDS_QUERY,
  TECHNICIAN_BY_ID_QUERY,
  TECHNICIANS_QUERY,
  BOOKING_SETTINGS_QUERY,
} from '@/booking/lib/queries';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { getStripe } from '@/booking/lib/stripe';
import { getBookingCreateRateLimit, getClientIp } from '@/booking/lib/rate-limit';
import { getAvailableSlots, pickLeastBusyTech } from '@/booking/lib/availability';
import { buildSnapshot, orderServicesByIds } from '@/booking/lib/snapshot';
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
  // 1-3 service ids. Single-service bookings just send a one-element array.
  serviceIds: z.array(z.string().min(1)).min(1).max(3),
  // Either a specific tech id, or 'any'.
  technicianId: z.string().min(1),
  // Date in salon timezone, "YYYY-MM-DD".
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Start time in UTC ISO. Server re-validates against availability.
  startUtc: z.string().min(10),
  customer: z.object({
    name: z.string().min(1).max(80),
    phone: z.string().regex(PHONE_REGEX),
    // Email required so we can send the booking confirmation + .ics + cancel link.
    email: z.string().email().max(120),
    notes: z.string().max(2000).optional().or(z.literal('')),
  }),
});

export async function POST(request: Request) {
  let body: z.infer<typeof Body>;
  try {
    const json = await request.json();
    body = Body.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_request', detail: (err as Error).message },
      { status: 400 },
    );
  }

  // 1. Rate limit
  const ip = getClientIp(request);
  try {
    const limiter = getBookingCreateRateLimit();
    const { success } = await limiter.limit(`ip:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
  } catch (err) {
    // Upstash misconfig — fail closed in production, log in dev.
    if (process.env.NODE_ENV === 'production') {
      console.error('[booking create] rate limit unavailable, refusing request', err);
      return NextResponse.json({ error: 'rate_limit_unavailable' }, { status: 503 });
    }
    console.warn('[booking create] rate limit unavailable in dev, allowing', (err as Error).message);
  }

  // 2. Re-fetch service(s) + settings + tech(s) from Sanity (server-trusted source)
  const [services, settings, allTechs] = await Promise.all([
    sanityClient.fetch<BookingService[]>(BOOKING_SERVICES_BY_IDS_QUERY, { ids: body.serviceIds }),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
  ]);

  if (
    services.length !== body.serviceIds.length ||
    services.some((s) => !s.isActive)
  ) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 400 });
  }
  if (!settings || !settings.isBookingEnabled) {
    return NextResponse.json({ error: 'booking_disabled' }, { status: 503 });
  }

  // Tech qualified iff their services array includes EVERY selected service id.
  const qualifiedTechs = allTechs.filter(
    (t) =>
      t.isActive &&
      body.serviceIds.every((sid) =>
        (t.services as unknown as string[] | undefined)?.includes(sid),
      ),
  );
  if (qualifiedTechs.length === 0) {
    return NextResponse.json({ error: 'no_qualified_technicians' }, { status: 400 });
  }

  // 3. Re-compute availability — proves the requested slot is real.
  // Services must be in user-selection order so trailing-buffer matches the snapshot.
  const orderedForAvailability = orderServicesByIds(body.serviceIds, services);
  const slots = await getAvailableSlots({
    services: orderedForAvailability,
    technicians:
      body.technicianId === 'any'
        ? qualifiedTechs
        : qualifiedTechs.filter((t) => t._id === body.technicianId),
    settings,
    date: body.date,
  });

  const matchingSlot = slots.find((s) => s.startUtc === body.startUtc);
  if (!matchingSlot) {
    return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 });
  }

  // 4. Resolve actual technician id
  let technicianId: string;
  if (body.technicianId === 'any') {
    const picked = await pickLeastBusyTech(matchingSlot.qualifiedTechnicianIds, body.date, settings);
    if (!picked) {
      return NextResponse.json({ error: 'no_qualified_technicians' }, { status: 400 });
    }
    technicianId = picked;
  } else {
    if (!matchingSlot.qualifiedTechnicianIds.includes(body.technicianId)) {
      return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 });
    }
    technicianId = body.technicianId;
  }

  const technician = qualifiedTechs.find((t) => t._id === technicianId);
  if (!technician) {
    return NextResponse.json({ error: 'tech_not_found' }, { status: 400 });
  }

  // 5. Per-phone pending cap
  const supabase = getSupabaseAdmin();
  const phoneNormalized = body.customer.phone.replace(E164_NORMALIZE, '').slice(0, 20);

  const ttlIso = new Date(
    Date.now() - settings.pendingPaymentTtlMinutes * 60 * 1000,
  ).toISOString();
  const { count: pendingCount } = await supabase
    .from('booking_appointments')
    .select('id, customer_id, booking_customers!inner(phone)', { count: 'exact', head: true })
    .eq('status', 'pending_payment')
    .gte('created_at', ttlIso)
    .eq('booking_customers.phone', phoneNormalized);

  if ((pendingCount ?? 0) >= 3) {
    return NextResponse.json({ error: 'too_many_pending_for_phone' }, { status: 429 });
  }

  // 6. INSERT booking with snapshot.
  const cancelToken = randomBytes(32).toString('base64url');
  const snapshot = buildSnapshot(orderedForAvailability, technician);

  const { data: insertResult, error: insertError } = await supabase
    .from('booking_appointments')
    .insert({
      status: 'pending_payment',
      ...snapshot,
      start_at: matchingSlot.startUtc,
      end_at: matchingSlot.endUtc,
      payment_method: 'stripe',
      source: 'online',
      notes: body.customer.notes || null,
      cancel_token: cancelToken,
      currency: 'nzd',
      client_ip: ip === 'unknown' ? null : ip,
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23P01' || /exclusion/i.test(insertError.message)) {
      return NextResponse.json({ error: 'slot_just_taken' }, { status: 409 });
    }
    console.error('[booking create] insert failed', insertError);
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  const bookingId = insertResult.id as string;

  // 7. Stripe Checkout Session
  const stripe = getStripe();
  const origin = new URL(request.url).origin;
  const successUrl = `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/book?abandoned=1`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'nzd',
          unit_amount: snapshot.deposit_cents_snapshot,
          product_data: {
            name: `Deposit — ${snapshot.service_name_snapshot} with ${technician.name}`,
            description: formatSlotDescription(matchingSlot.startUtc, settings.salonTimezone),
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: body.customer.email || undefined,
    // Stripe requires at least 30 minutes between now and expires_at; clamp our setting up
    // to that minimum even if the salon configures a shorter pending TTL. Our internal
    // pending-row expiry still uses the configured TTL — Stripe just keeps its session
    // alive a little longer, which is harmless.
    expires_at:
      Math.floor(Date.now() / 1000) +
      Math.max(30, settings.pendingPaymentTtlMinutes) * 60,
    metadata: {
      booking_id: bookingId,
      customer_name: body.customer.name,
      customer_phone: phoneNormalized,
      tech_id: technicianId,
      // Comma-joined for multi-service; first id remains "primary".
      service_ids: body.serviceIds.join(','),
    },
    payment_intent_data: {
      metadata: {
        booking_id: bookingId,
      },
    },
  });

  if (!session.url) {
    console.error('[booking create] stripe session has no url', session.id);
    return NextResponse.json({ error: 'stripe_no_url' }, { status: 500 });
  }

  // 8. Persist Stripe session id on the booking row
  await supabase
    .from('booking_appointments')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', bookingId);

  return NextResponse.json({ checkoutUrl: session.url, bookingId });
}

function formatSlotDescription(startUtc: string, tz: string): string {
  const date = new Date(startUtc);
  const dt = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return dt;
}
