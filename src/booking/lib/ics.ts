// Calendar attachment (.ics) generator. Server-only.
// Uses ical-generator for safe escaping of user-supplied text and proper VTIMEZONE.

import 'server-only';

import ical, { ICalCalendarMethod } from 'ical-generator';

export interface IcsInput {
  uid: string;                    // stable booking id, used as ICS UID
  startUtc: string;               // ISO 8601
  endUtc: string;                 // ISO 8601
  summary: string;                // event title — e.g. "Atelier Lumière: Gel Polish"
  description?: string;           // longer details
  location?: string;              // salon address
  organizerName?: string;
  organizerEmail?: string;
  attendeeEmail?: string;
  timezone: string;               // IANA tz, e.g. "UTC"
}

/**
 * Returns an .ics file body suitable for email attachment.
 */
export function buildIcs(input: IcsInput): string {
  const cal = ical({
    name: input.summary,
    method: ICalCalendarMethod.REQUEST,
    timezone: input.timezone,
    prodId: { company: 'Atelier Lumière', product: 'Booking', language: 'EN' },
  });

  cal.createEvent({
    id: input.uid,
    start: new Date(input.startUtc),
    end: new Date(input.endUtc),
    summary: input.summary,
    description: input.description,
    location: input.location,
    organizer: input.organizerName && input.organizerEmail
      ? { name: input.organizerName, email: input.organizerEmail }
      : undefined,
    attendees: input.attendeeEmail
      ? [{ email: input.attendeeEmail, rsvp: false }]
      : undefined,
  });

  return cal.toString();
}
