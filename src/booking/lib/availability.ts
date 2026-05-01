// Slot availability computation. Server-only.
//
// See plan: "Availability Logic" section. Composed in layers:
//   1. Salon-level filters (kill switch, booking window, public holidays)
//   2. Resolve technician(s) — single or 'any' (qualified set)
//   3. Tech working hours for date (weekly schedule + time off)
//   4. Generate candidate start times on slotInterval grid (skipping lunch break)
//   5. Past + min-hours-ahead filter
//   6. Filter against existing bookings (confirmed + valid pending)
//
// All datetime math runs in salon timezone via date-fns-tz.
// Storage is timestamptz (UTC); conversion happens at boundaries only.

import 'server-only';

import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import {
  addDays,
  addMinutes,
  isBefore,
  isEqual,
  parse,
  startOfDay,
} from 'date-fns';
import type {
  BookingService,
  BookingSettings,
  Technician,
  TechnicianDaySchedule,
} from './types';
import { getSupabaseAdmin } from './supabase-server';

export interface AvailabilityInput {
  /** Single service (legacy single-service path) OR array of services for multi-service combos. */
  service?: BookingService;
  services?: BookingService[];
  technicians: Technician[];           // pre-filtered to ones qualified for ALL services
  settings: BookingSettings;
  date: string;                        // "YYYY-MM-DD" in salon tz
  now?: Date;                          // override for testing
  /** When rescheduling, exclude this booking from the conflict set so the booking
   *  doesn't block itself out of its current and adjacent slots. */
  excludeBookingId?: string;
}

export interface AvailabilitySlot {
  startUtc: string;                    // ISO 8601, UTC
  endUtc: string;                      // ISO 8601, UTC
  qualifiedTechnicianIds: string[];    // techs free for this slot — server picks one for 'any'
}

/**
 * Compute available start times for a given service on a given date.
 * Returns slots sorted by start time. Each slot lists which qualified techs are free.
 */
export async function getAvailableSlots(
  input: AvailabilityInput,
): Promise<AvailabilitySlot[]> {
  const { technicians, settings, date } = input;
  const services = input.services ?? (input.service ? [input.service] : []);
  if (services.length === 0) return [];
  const now = input.now ?? new Date();

  // Layer 1 — salon-level filters
  if (!settings.isBookingEnabled) return [];
  if (services.some((s) => !s.isActive)) return [];

  const salonTz = settings.salonTimezone || 'UTC';

  // Booking window (salon tz)
  const todayInSalonTz = formatDateInTz(now, salonTz);
  const dateInRange =
    date >= todayInSalonTz &&
    date <= addDaysInTz(todayInSalonTz, settings.maxDaysAheadToBook);
  if (!dateInRange) return [];

  // Public holiday check
  const isHoliday = (settings.publicHolidayDates ?? []).some((h) => h.date === date);
  if (isHoliday) return [];

  if (technicians.length === 0) return [];

  // Layer 2-4 — per technician, build candidate slots.
  // Total duration = sum of all service durations + a single trailing buffer (the last
  // service's buffer). Buffers between same-tech same-block services don't apply.
  // Services are processed in input order so this matches buildSnapshot's "primary" /
  // trailing-buffer choice. Callers that fetch via GROQ `_id in $ids` should re-order
  // first via `orderServicesByIds`.
  const sumDurations = services.reduce((s, sv) => s + sv.durationMinutes, 0);
  const trailingBuffer = services[services.length - 1].bufferMinutes ?? 0;
  const totalDuration = sumDurations + trailingBuffer;
  const minAhead = addMinutes(now, settings.minHoursAheadToBook * 60);

  type CandidatePerTech = { techId: string; startUtc: Date; endUtc: Date };
  const allCandidates: CandidatePerTech[] = [];

  for (const tech of technicians) {
    if (!tech.isActive) continue;

    // Layer 3 — tech window for this date
    const dow = weekdayInTz(date, salonTz);
    const day = (tech.weeklySchedule ?? []).find((d) => d.dayOfWeek === dow);
    if (!day || !day.isWorkingDay || !day.startTime || !day.endTime) continue;

    // Time off
    const onTimeOff = (tech.timeOff ?? []).some(
      (t) => date >= t.startDate && date <= t.endDate,
    );
    if (onTimeOff) continue;

    const workStartUtc = combineDateAndTimeUtc(date, day.startTime, salonTz);
    const workEndUtc = combineDateAndTimeUtc(date, day.endTime, salonTz);

    const breakUtc = breakWindowUtc(date, day, salonTz);

    // Layer 4 — slot grid
    let cursor = workStartUtc;
    while (
      isBefore(addMinutes(cursor, totalDuration), workEndUtc) ||
      isEqual(addMinutes(cursor, totalDuration), workEndUtc)
    ) {
      const candidateEnd = addMinutes(cursor, totalDuration);

      // Skip if overlapping break
      const overlapsBreak =
        breakUtc !== null &&
        isBefore(cursor, breakUtc.endUtc) &&
        isBefore(breakUtc.startUtc, candidateEnd);

      // Layer 5 — past + min-hours buffer
      const beforeMinAhead = isBefore(cursor, minAhead);

      if (!overlapsBreak && !beforeMinAhead) {
        allCandidates.push({
          techId: tech._id,
          startUtc: cursor,
          endUtc: candidateEnd,
        });
      }

      cursor = addMinutes(cursor, settings.slotIntervalMinutes);
    }
  }

  if (allCandidates.length === 0) return [];

  // Layer 6 — query existing bookings to filter conflicts
  const dayStartUtc = combineDateAndTimeUtc(date, '00:00', salonTz);
  // Include the prior date's range to catch cross-midnight bookings.
  const dayBefore = addDaysInTz(date, -1);
  const queryStart = combineDateAndTimeUtc(dayBefore, '00:00', salonTz);
  const queryEnd = addMinutes(dayStartUtc, 24 * 60);

  const supabase = getSupabaseAdmin();
  const techIds = Array.from(new Set(allCandidates.map((c) => c.techId)));

  let query = supabase
    .from('booking_appointments')
    .select('id, technician_sanity_id, start_at, end_at, status, created_at')
    .in('technician_sanity_id', techIds)
    .gte('start_at', queryStart.toISOString())
    .lt('start_at', queryEnd.toISOString())
    .in('status', ['confirmed', 'pending_payment']);

  // When rescheduling a specific booking, exclude it from its own conflict set.
  if (input.excludeBookingId) {
    query = query.neq('id', input.excludeBookingId);
  }

  const { data: existing, error } = await query;

  if (error) {
    console.error('[booking availability] supabase query failed', error);
    throw new Error('availability_query_failed');
  }

  const ttlMs = settings.pendingPaymentTtlMinutes * 60 * 1000;
  const ttlCutoff = new Date(now.getTime() - ttlMs);

  type ExistingRange = { techId: string; startUtc: Date; endUtc: Date };
  const occupied: ExistingRange[] = (existing ?? [])
    .filter((row) => {
      if (row.status === 'confirmed') return true;
      if (row.status === 'pending_payment') {
        // Exclude pending bookings that have aged out — slot reopens.
        return new Date(row.created_at) > ttlCutoff;
      }
      return false;
    })
    .map((row) => ({
      techId: row.technician_sanity_id,
      startUtc: new Date(row.start_at),
      endUtc: new Date(row.end_at),
    }));

  // Group candidates by [start, end) and aggregate qualified techs
  const grouped = new Map<string, AvailabilitySlot>();
  for (const c of allCandidates) {
    const key = `${c.startUtc.toISOString()}_${c.endUtc.toISOString()}`;
    // Skip if conflicting with existing booking for THIS tech
    const conflict = occupied.some(
      (e) =>
        e.techId === c.techId &&
        rangesOverlap(c.startUtc, c.endUtc, e.startUtc, e.endUtc),
    );
    if (conflict) continue;

    if (!grouped.has(key)) {
      grouped.set(key, {
        startUtc: c.startUtc.toISOString(),
        endUtc: c.endUtc.toISOString(),
        qualifiedTechnicianIds: [c.techId],
      });
    } else {
      grouped.get(key)!.qualifiedTechnicianIds.push(c.techId);
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.startUtc < b.startUtc ? -1 : 1,
  );
}

/**
 * Pick the technician for an "Any preference" booking using least-busy-that-day strategy.
 * Returns the chosen technician id from the qualified set.
 */
export async function pickLeastBusyTech(
  qualifiedTechIds: string[],
  date: string,
  settings: BookingSettings,
): Promise<string | null> {
  if (qualifiedTechIds.length === 0) return null;
  if (qualifiedTechIds.length === 1) return qualifiedTechIds[0];

  const salonTz = settings.salonTimezone || 'UTC';
  const dayStartUtc = combineDateAndTimeUtc(date, '00:00', salonTz);
  const dayEndUtc = addMinutes(dayStartUtc, 24 * 60);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('booking_appointments')
    .select('technician_sanity_id, status')
    .in('technician_sanity_id', qualifiedTechIds)
    .gte('start_at', dayStartUtc.toISOString())
    .lt('start_at', dayEndUtc.toISOString())
    .in('status', ['confirmed', 'pending_payment']);

  if (error) {
    console.error('[booking pickLeastBusyTech] query failed', error);
    return qualifiedTechIds[0]; // fallback rather than fail the booking
  }

  const counts = new Map<string, number>(qualifiedTechIds.map((id) => [id, 0]));
  for (const row of data ?? []) {
    counts.set(row.technician_sanity_id, (counts.get(row.technician_sanity_id) ?? 0) + 1);
  }

  // Sort qualifiedTechIds by count asc, preserving original order on ties.
  return qualifiedTechIds
    .slice()
    .sort((a, b) => (counts.get(a)! - counts.get(b)!))
    [0];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  // Half-open interval semantics: [start, end). Touching ranges do NOT overlap.
  return aStart < bEnd && bStart < aEnd;
}

function combineDateAndTimeUtc(date: string, time: string, tz: string): Date {
  // date = "YYYY-MM-DD", time = "HH:mm". Interpret as a wall-clock time in `tz`,
  // then convert to UTC.
  const wallclock = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', startOfDay(new Date()));
  return fromZonedTime(wallclock, tz);
}

function formatDateInTz(date: Date, tz: string): string {
  // Returns "YYYY-MM-DD" representing the wall-clock date in tz.
  const zoned = toZonedTime(date, tz);
  const y = zoned.getFullYear();
  const m = String(zoned.getMonth() + 1).padStart(2, '0');
  const d = String(zoned.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysInTz(date: string, days: number): string {
  // Pure string math — date is a calendar date, no DST consideration.
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function weekdayInTz(date: string, tz: string): number {
  // 0=Sunday, 6=Saturday. Stable across DST because it operates on the calendar date.
  const noon = combineDateAndTimeUtc(date, '12:00', tz);
  const zoned = toZonedTime(noon, tz);
  return zoned.getDay();
}

function breakWindowUtc(
  date: string,
  day: TechnicianDaySchedule,
  tz: string,
): { startUtc: Date; endUtc: Date } | null {
  if (!day.breakStart || !day.breakEnd) return null;
  return {
    startUtc: combineDateAndTimeUtc(date, day.breakStart, tz),
    endUtc: combineDateAndTimeUtc(date, day.breakEnd, tz),
  };
}
