'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { safeJson } from '@/booking/lib/templating';
import type { BookingSettings, Technician } from '@/booking/lib/types';
import { DayView } from './CalendarViews/DayView';
import { WeekView } from './CalendarViews/WeekView';
import { MonthView } from './CalendarViews/MonthView';
import { ThreeMonthView } from './CalendarViews/ThreeMonthView';

export type CalendarView = 'day' | 'week' | 'month' | '3month';

export interface CalendarBooking {
  id: string;
  status: 'confirmed' | 'pending_payment';
  startUtc: string;
  endUtc: string;
  technicianId: string;
  technicianName: string;
  serviceName: string;
  paymentMethod: 'stripe' | 'in_store' | 'comp';
  customerName: string | null;
}

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '3month', label: '3 Months' },
];

export function Calendar({
  settings,
  technicians,
}: {
  settings: BookingSettings | null;
  technicians: Technician[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tz = settings?.salonTimezone ?? 'UTC';

  const rawView = searchParams?.get('view') ?? 'day';
  const view: CalendarView = (['day', 'week', 'month', '3month'] as const).includes(
    rawView as CalendarView,
  )
    ? (rawView as CalendarView)
    : 'day';
  const rawDate = searchParams?.get('date') ?? '';
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : formatDateInTz(new Date(), tz);

  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(false);

  // Compute the date range based on view + anchor date.
  const range = useMemo(() => computeRange(view, initialDate), [view, initialDate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/admin/calendar?from=${range.from}&to=${range.to}`,
      { cache: 'no-store' },
    )
      .then((r) => safeJson<{ bookings?: CalendarBooking[] }>(r))
      .then((data) => {
        if (cancelled) return;
        setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
      })
      .catch(() => {
        if (!cancelled) setBookings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  function navigate(view: CalendarView, date: string) {
    const sp = new URLSearchParams();
    sp.set('view', view);
    sp.set('date', date);
    router.push(`/admin/calendar?${sp.toString()}`);
  }

  function shift(direction: 1 | -1) {
    const next = shiftDate(view, initialDate, direction);
    navigate(view, next);
  }

  function jumpToToday() {
    navigate(view, formatDateInTz(new Date(), tz));
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="booking-cta booking-cta--secondary"
            onClick={() => shift(-1)}
            style={{ padding: '0.4rem 0.7rem' }}
            aria-label="Previous"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="booking-cta booking-cta--secondary"
            onClick={jumpToToday}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.7rem' }}
          >
            Today
          </button>
          <button
            type="button"
            className="booking-cta booking-cta--secondary"
            onClick={() => shift(1)}
            style={{ padding: '0.4rem 0.7rem' }}
            aria-label="Next"
          >
            <ChevronRight size={14} />
          </button>
          <span
            style={{
              marginLeft: '0.75rem',
              fontSize: '0.95rem',
              fontFamily: 'var(--booking-heading-font)',
            }}
          >
            {labelForRange(view, initialDate, tz)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              className="booking-cta booking-cta--secondary"
              onClick={() => navigate(v.key, initialDate)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.7rem',
                background:
                  view === v.key ? 'var(--booking-color-accent-muted)' : undefined,
                borderColor:
                  view === v.key ? 'var(--booking-color-accent)' : undefined,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="booking-muted" style={{ fontSize: '0.85rem' }}>
          Loading…
        </p>
      ) : view === 'day' ? (
        <DayView
          date={initialDate}
          tz={tz}
          technicians={technicians}
          bookings={bookings}
        />
      ) : view === 'week' ? (
        <WeekView
          date={initialDate}
          tz={tz}
          technicians={technicians}
          bookings={bookings}
          onPickDay={(d) => navigate('day', d)}
        />
      ) : view === 'month' ? (
        <MonthView
          date={initialDate}
          tz={tz}
          bookings={bookings}
          onPickDay={(d) => navigate('day', d)}
        />
      ) : (
        <ThreeMonthView
          date={initialDate}
          tz={tz}
          bookings={bookings}
          onPickDay={(d) => navigate('day', d)}
        />
      )}
    </div>
  );
}

// ── Range + label helpers ────────────────────────────────────────────

function formatDateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate(),
  ).padStart(2, '0')}`;
}

function startOfWeek(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Sunday-start week (consistent with the customer wizard's calendar layout).
  const offset = dt.getUTCDay();
  return addDays(date, -offset);
}

function startOfMonth(date: string): string {
  const [y, m] = date.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

function endOfMonth(date: string): string {
  const [y, m] = date.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
}

function shiftDate(view: CalendarView, date: string, dir: 1 | -1): string {
  if (view === 'day') return addDays(date, dir);
  if (view === 'week') return addDays(date, dir * 7);
  if (view === 'month') {
    const [y, m] = date.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1 + dir, 1));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }
  // 3month — shift one month at a time
  const [y, m] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + dir, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function computeRange(view: CalendarView, date: string): { from: string; to: string } {
  if (view === 'day') return { from: date, to: date };
  if (view === 'week') {
    const start = startOfWeek(date);
    return { from: start, to: addDays(start, 6) };
  }
  if (view === 'month') {
    return { from: startOfMonth(date), to: endOfMonth(date) };
  }
  // 3month — anchor month + previous + next, full ranges
  const [y, m] = date.split('-').map(Number);
  const startMonth = new Date(Date.UTC(y, m - 2, 1));
  const endMonth = new Date(Date.UTC(y, m + 1, 0));
  const fy = startMonth.getUTCFullYear();
  const fm = String(startMonth.getUTCMonth() + 1).padStart(2, '0');
  const ty = endMonth.getUTCFullYear();
  const tm = String(endMonth.getUTCMonth() + 1).padStart(2, '0');
  const td = String(endMonth.getUTCDate()).padStart(2, '0');
  return { from: `${fy}-${fm}-01`, to: `${ty}-${tm}-${td}` };
}

function labelForRange(view: CalendarView, date: string, tz: string): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-NZ', { timeZone: tz, ...opts }).format(d);

  const [y, m, d] = date.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12));

  if (view === 'day') {
    return fmt(anchor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (view === 'week') {
    const start = new Date(Date.UTC(y, m - 1, d - anchor.getUTCDay(), 12));
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    return `${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (view === 'month') {
    return fmt(anchor, { month: 'long', year: 'numeric' });
  }
  // 3month
  const prev = new Date(Date.UTC(y, m - 2, 1, 12));
  const next = new Date(Date.UTC(y, m, 1, 12));
  return `${fmt(prev, { month: 'short' })} – ${fmt(next, { month: 'short', year: 'numeric' })}`;
}
