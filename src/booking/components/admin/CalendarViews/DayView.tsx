'use client';

import Link from 'next/link';
import type { Technician } from '@/booking/lib/types';
import type { CalendarBooking } from '../Calendar';

const HOUR_PX = 56;
const HOUR_START = 8;
const HOUR_END = 21; // 9pm — last visible hour
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

export function DayView({
  date,
  tz,
  technicians,
  bookings,
}: {
  date: string;
  tz: string;
  technicians: Technician[];
  bookings: CalendarBooking[];
}) {
  const sameDay = bookings.filter((b) => formatDate(b.startUtc, tz) === date);
  const techsToShow = technicians.length > 0 ? technicians : [];

  if (techsToShow.length === 0) {
    return (
      <p
        className="booking-muted"
        style={{ padding: '2rem', textAlign: 'center', fontSize: '0.85rem' }}
      >
        No active technicians.
      </p>
    );
  }

  return (
    <>
      {/* Wide-screen: side-by-side timeline grid */}
      <div
        className="booking-card booking-cal-day-grid"
        style={
          {
            position: 'relative',
            overflow: 'auto',
            padding: 0,
            ['--cal-tech-count' as string]: techsToShow.length,
          } as React.CSSProperties
        }
      >
        {/* Header row */}
        <div
          style={{
            background: 'var(--booking-color-surface-muted)',
            borderBottom: '1px solid var(--booking-color-border)',
            padding: '0.75rem 0.5rem',
          }}
        />
        {techsToShow.map((tech) => (
          <div
            key={tech._id}
            style={{
              background: 'var(--booking-color-surface-muted)',
              borderBottom: '1px solid var(--booking-color-border)',
              borderLeft: '1px solid var(--booking-color-border)',
              padding: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            {tech.name}
            {tech.specialty ? (
              <div className="booking-muted" style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                {tech.specialty}
              </div>
            ) : null}
          </div>
        ))}

        {HOURS.map((hour, hourIdx) => (
          <div key={hour} style={{ display: 'contents' }}>
            <div
              style={{
                height: HOUR_PX,
                fontSize: '0.7rem',
                color: 'var(--booking-color-text-muted)',
                padding: '0.25rem 0.5rem',
                borderBottom: '1px solid var(--booking-color-border)',
                background: 'var(--booking-color-surface-muted)',
              }}
            >
              {formatHour(hour)}
            </div>
            {techsToShow.map((tech) => (
              <div
                key={tech._id + '_' + hour}
                style={{
                  height: HOUR_PX,
                  borderBottom: '1px solid var(--booking-color-border)',
                  borderLeft: '1px solid var(--booking-color-border)',
                  position: hourIdx === 0 ? 'relative' : undefined,
                }}
              >
                {hourIdx === 0
                  ? sameDay
                      .filter((b) => b.technicianId === tech._id)
                      .map((b) => (
                        <BookingBlock
                          key={b.id}
                          booking={b}
                          tz={tz}
                          totalHours={HOUR_END - HOUR_START + 1}
                        />
                      ))
                  : null}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile: per-tech stacked card list */}
      <div className="booking-cal-day-stack">
        {techsToShow.map((tech) => {
          const techBookings = sameDay
            .filter((b) => b.technicianId === tech._id)
            .sort((a, b) => (a.startUtc < b.startUtc ? -1 : 1));
          return (
            <div
              key={tech._id}
              className="booking-card"
              style={{ padding: '0.75rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{tech.name}</span>
                <span className="booking-muted" style={{ fontSize: '0.75rem' }}>
                  {techBookings.length} booking{techBookings.length === 1 ? '' : 's'}
                </span>
              </div>
              {techBookings.length === 0 ? (
                <p className="booking-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                  No bookings.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {techBookings.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--booking-radius-sm)',
                          background:
                            b.status === 'pending_payment'
                              ? 'color-mix(in srgb, var(--booking-color-warning) 22%, var(--booking-color-surface))'
                              : 'var(--booking-color-accent-muted)',
                          color: 'var(--booking-color-text-primary)',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {formatTime(b.startUtc, tz)}
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            textAlign: 'right',
                          }}
                        >
                          {b.serviceName}
                          {b.customerName ? ` · ${b.customerName}` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function BookingBlock({
  booking,
  tz,
  totalHours,
}: {
  booking: CalendarBooking;
  tz: string;
  totalHours: number;
}) {
  const startMin = minutesIntoDayTz(booking.startUtc, tz);
  const endMin = minutesIntoDayTz(booking.endUtc, tz);
  const dayStartMin = HOUR_START * 60;
  const dayEndMin = (HOUR_START + totalHours) * 60;
  const top = Math.max(0, ((startMin - dayStartMin) / 60) * HOUR_PX);
  const height = Math.max(
    20,
    ((Math.min(endMin, dayEndMin) - Math.max(startMin, dayStartMin)) / 60) * HOUR_PX,
  );
  const isPending = booking.status === 'pending_payment';

  const startLabel = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(booking.startUtc));

  return (
    <Link
      href={`/admin/bookings/${booking.id}`}
      style={{
        position: 'absolute',
        top,
        left: 4,
        right: 4,
        height,
        padding: '0.35rem 0.5rem',
        borderRadius: 'var(--booking-radius-sm)',
        background: isPending
          ? 'color-mix(in srgb, var(--booking-color-warning) 25%, var(--booking-color-surface))'
          : 'var(--booking-color-accent-muted)',
        border: `1px solid ${isPending ? 'var(--booking-color-warning)' : 'var(--booking-color-accent)'}`,
        color: 'var(--booking-color-text-primary)',
        fontSize: '0.7rem',
        textDecoration: 'none',
        overflow: 'hidden',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1rem',
      }}
    >
      <div style={{ fontWeight: 500, fontSize: '0.75rem' }}>{startLabel}</div>
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {booking.serviceName}
      </div>
      {booking.customerName ? (
        <div
          className="booking-muted"
          style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {booking.customerName}
        </div>
      ) : null}
    </Link>
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

function formatTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatHour(hour: number): string {
  if (hour === 12) return '12pm';
  if (hour === 0) return '12am';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function minutesIntoDayTz(iso: string, tz: string): number {
  const dt = new Date(iso);
  const fmt = new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(dt);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}
