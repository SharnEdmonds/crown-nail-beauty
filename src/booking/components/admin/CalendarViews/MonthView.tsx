'use client';

import type { CalendarBooking } from '../Calendar';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MonthView({
  date,
  tz,
  bookings,
  onPickDay,
}: {
  date: string;
  tz: string;
  bookings: CalendarBooking[];
  onPickDay: (date: string) => void;
}) {
  const [year, month] = date.split('-').map(Number);
  const cells = monthCells(year, month);

  // Group bookings by date string
  const byDate = new Map<string, CalendarBooking[]>();
  for (const b of bookings) {
    const d = formatDate(b.startUtc, tz);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(b);
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.4rem',
      }}
    >
      {WEEKDAYS.map((d, i) => (
        <div
          key={i}
          className="booking-helper"
          style={{
            textAlign: 'center',
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '0.25rem 0',
          }}
        >
          {d}
        </div>
      ))}
      {cells.map((cell, i) => {
        if (!cell) return <div key={`empty-${i}`} />;
        const dayBookings = byDate.get(cell.date) ?? [];
        const confirmed = dayBookings.filter((b) => b.status === 'confirmed').length;
        const pending = dayBookings.filter((b) => b.status === 'pending_payment').length;
        return (
          <button
            key={cell.date}
            type="button"
            onClick={() => onPickDay(cell.date)}
            className="booking-card"
            style={{
              aspectRatio: '1',
              minHeight: '90px',
              padding: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>{cell.day}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {confirmed > 0 ? (
                <span
                  className="booking-badge booking-badge--accent"
                  style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}
                >
                  {confirmed} ✓
                </span>
              ) : null}
              {pending > 0 ? (
                <span
                  className="booking-badge booking-badge--warning"
                  style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}
                >
                  {pending} pending
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function monthCells(year: number, month: number): Array<{ date: string; day: number } | null> {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = first.getUTCDay();
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<{ date: string; day: number } | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
    });
  }
  return cells;
}

function formatDate(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}
