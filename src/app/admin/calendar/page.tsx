// /admin/calendar — owner's day/week/month view of bookings.

import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_SETTINGS_QUERY,
  TECHNICIANS_QUERY,
} from '@/booking/lib/queries';
import { Calendar } from '@/booking/components/admin/Calendar';
import type { BookingSettings, Technician } from '@/booking/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage() {
  const [settings, technicians] = await Promise.all([
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
  ]);
  return (
    <div>
      <h2 className="booking-heading" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        Calendar
      </h2>
      <p className="booking-helper" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Day, week, month, and 3-month views of all upcoming bookings.
      </p>
      <Calendar
        settings={settings}
        technicians={technicians.filter((t) => t.isActive)}
      />
    </div>
  );
}
