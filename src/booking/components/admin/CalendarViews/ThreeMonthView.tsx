'use client';

import type { CalendarBooking } from '../Calendar';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function ThreeMonthView({
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

  // Group bookings by date once
  const byDate = new Map<string, number>();
  for (const b of bookings) {
    const d = formatDate(b.startUtc, tz);
    byDate.set(d, (byDate.get(d) ?? 0) + 1);
  }

  // Render anchor month - 1, anchor, anchor + 1
  const months: { label: string; year: number; month: number }[] = [];
  for (let offset = -1; offset <= 1; offset++) {
    const dt = new Date(Date.UTC(year, month - 1 + offset, 1));
    months.push({
      label: new Intl.DateTimeFormat('en-NZ', {
        timeZone: tz,
        month: 'long',
        year: 'numeric',
      }).format(dt),
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
    });
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
      }}
    >
      {months.map((m) => (
        <div key={`${m.year}-${m.month}`} className="booking-card booking-card-pad">
          <div style={{ fontFamily: 'var(--booking-heading-font)', marginBottom: '0.5rem' }}>
            {m.label}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
            }}
          >
            {WEEKDAYS.map((d, i) => (
              <div
                key={i}
                className="booking-helper"
                style={{
                  textAlign: 'center',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '0.15rem 0',
                }}
              >
                {d}
              </div>
            ))}
            {monthCells(m.year, m.month).map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} />;
              const count = byDate.get(cell.date) ?? 0;
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onPickDay(cell.date)}
                  style={{
                    aspectRatio: '1',
                    minHeight: '28px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    background:
                      count > 0
                        ? 'var(--booking-color-accent-muted)'
                        : 'var(--booking-color-surface)',
                    border: '1px solid var(--booking-color-border)',
                    color: 'var(--booking-color-text-primary)',
                    borderRadius: 'var(--booking-radius-sm)',
                    padding: '0.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={count > 0 ? `${count} booking${count > 1 ? 's' : ''}` : ''}
                >
                  <span>{cell.day}</span>
                  {count > 0 ? (
                    <span style={{ fontSize: '0.55rem', color: 'var(--booking-color-accent)' }}>
                      ●
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
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
