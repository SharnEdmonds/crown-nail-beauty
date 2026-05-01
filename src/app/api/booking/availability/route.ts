// GET /api/booking/availability?serviceIds=id1,id2&technicianId=...&date=YYYY-MM-DD
// (Backwards compatible: also accepts singular `?serviceId=...`)
//
// Public endpoint — returns the list of available slots for the wizard's date+time step.
// The wizard caches this client-side for 30s. Server re-validates on actual booking submit.
//
// For multi-service: requires the technician to be qualified for ALL selected services.
// Combined duration is the sum of all selected services' durations + a single trailing buffer.

import { NextResponse } from 'next/server';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_SERVICES_BY_IDS_QUERY,
  BOOKING_SETTINGS_QUERY,
  TECHNICIANS_QUERY,
} from '@/booking/lib/queries';
import { getAvailableSlots } from '@/booking/lib/availability';
import type {
  BookingService,
  BookingSettings,
  Technician,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceIdsParam = url.searchParams.get('serviceIds');
  const legacyServiceId = url.searchParams.get('serviceId');
  const technicianId = url.searchParams.get('technicianId');
  const date = url.searchParams.get('date');
  const excludeBookingId = url.searchParams.get('excludeBookingId') ?? undefined;

  const serviceIds: string[] = serviceIdsParam
    ? serviceIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
    : legacyServiceId
      ? [legacyServiceId]
      : [];

  if (serviceIds.length === 0 || !technicianId || !date) {
    return NextResponse.json(
      { error: 'missing_params', detail: 'serviceIds (or serviceId), technicianId, date are required' },
      { status: 400 },
    );
  }
  if (serviceIds.length > 3) {
    return NextResponse.json(
      { error: 'too_many_services', detail: 'Maximum 3 services per booking.' },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'bad_date' }, { status: 400 });
  }

  const [services, settings, allTechs] = await Promise.all([
    sanityClient.fetch<BookingService[]>(BOOKING_SERVICES_BY_IDS_QUERY, { ids: serviceIds }),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
  ]);

  if (services.length !== serviceIds.length || services.some((s) => !s.isActive)) {
    return NextResponse.json({ slots: [] });
  }
  if (!settings || !settings.isBookingEnabled) {
    return NextResponse.json({ slots: [] });
  }

  // Tech is qualified iff their services array includes EVERY selected service id.
  const qualified = allTechs.filter(
    (t) =>
      t.isActive &&
      serviceIds.every((sid) =>
        (t.services as unknown as string[] | undefined)?.includes(sid),
      ),
  );
  const targets =
    technicianId === 'any' ? qualified : qualified.filter((t) => t._id === technicianId);

  const slots = await getAvailableSlots({
    services,
    technicians: targets,
    settings,
    date,
    excludeBookingId,
  });

  return NextResponse.json({
    slots: slots.map((s) => ({ startUtc: s.startUtc, endUtc: s.endUtc })),
  });
}
