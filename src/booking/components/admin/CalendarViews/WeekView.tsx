'use client';

import Link from 'next/link';
import type { Technician } from '@/booking/lib/types';
import type { CalendarBooking } from '../Calendar';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekView({
  date,
  tz,
  technicians,
  bookings,
  onPickDay,
}: {
  date: string;
  tz: string;
  technicians: Technician[];
  bookings: CalendarBooking[];
  onPickDay: (date: string) => void;
}) {
  // Sunday-start week containing `date`.
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  // Index bookings by [date, techId] for quick lookup.
  const byDay = new Map<string, CalendarBooking[]>();
  for (const b of bookings) {
    const d = formatDate(b.startUtc, tz);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(b);
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))',
        gap: '0.5rem',
      }}
    >
      {days.map((d, i) => {
        const dayBookings = byDay.get(d) ?? [];
        // Group day's bookings by technician — sub-bands per the plan.
        const groupedByTech = technicians
          .map((tech) => ({
            tech,
            bookings: dayBookings
              .filter((b) => b.technicianId === tech._id)
              .sort((a, b) => (a.startUtc < b.startUtc ? -1 : 1)),
          }))
          .filter((g) => g.bookings.length > 0);

        return (
          <button
            key={d}
            type="button"
            onClick={() => onPickDay(d)}
            className="booking-card"
            style={{
              padding: '0.75rem',
              minHeight: '180px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span
                className="booking-helper"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                {WEEKDAYS[i]}
              </span>
              <span style={{ fontSize: '1rem', fontFamily: 'var(--booking-heading-font)' }}>
                {Number(d.split('-')[2])}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              {groupedByTech.length === 0 ? (
                <span className="booking-muted" style={{ fontSize: '0.7rem' }}>
                  No bookings
                </span>
              ) : (
                groupedByTech.map(({ tech, bookings: techBookings }) => (
                  <div key={tech._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span
                      className="booking-helper"
                      style={{
                        fontSize: '0.6rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {tech.name} · {techBookings.length}
                    </span>
                    {techBookings.slice(0, 3).map((b) => (
                      <Link
                        key={b.id}
                        href={`/admin/bookings/${b.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.35rem',
                          borderRadius: 'var(--booking-radius-sm)',
                          background:
                            b.status === 'pending_payment'
                              ? 'color-mix(in srgb, var(--booking-color-warning) 22%, var(--booking-color-surface))'
                              : 'var(--booking-color-accent-muted)',
                          color: 'var(--booking-color-text-primary)',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {timeLabel(b.startUtc, tz)} · {b.serviceName}
                      </Link>
                    ))}
                    {techBookings.length > 3 ? (
                      <span
                        className="booking-muted"
                        style={{ fontSize: '0.6rem' }}
                      >
                        +{techBookings.length - 3} more
                      </span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function timeLabel(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function startOfWeek(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return addDays(date, -dt.getUTCDay());
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
