// /admin/bookings/new — admin manual booking form. Reuses public wizard primitives.

import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_SERVICES_QUERY,
  BOOKING_SETTINGS_QUERY,
  TECHNICIANS_QUERY,
} from '@/booking/lib/queries';
import { ManualBookingForm } from '@/booking/components/admin/ManualBookingForm';
import type {
  BookingService,
  BookingSettings,
  Technician,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';

export default async function NewManualBookingPage() {
  const [services, technicians, settings] = await Promise.all([
    sanityClient.fetch<BookingService[]>(BOOKING_SERVICES_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
  ]);
  return (
    <div>
      <h2 className="booking-heading" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        New manual booking
      </h2>
      <p className="booking-helper" style={{ marginBottom: '1.5rem' }}>
        For phone bookings, walk-ins, or comp appointments.
      </p>
      <ManualBookingForm services={services} technicians={technicians} settings={settings} />
    </div>
  );
}
