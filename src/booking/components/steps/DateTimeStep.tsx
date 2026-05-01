'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCopy, useCopyArray } from '@/booking/lib/context';
import { safeJson } from '@/booking/lib/templating';
import type { BookingSettings } from '@/booking/lib/types';

interface ApiSlot {
  startUtc: string;
  endUtc: string;
}

export function DateTimeStep({
  serviceIds,
  technicianId,
  settings,
  date,
  startUtc,
  onChange,
}: {
  serviceIds: string[];
  technicianId: string;
  settings: BookingSettings | null;
  date: string | null;
  startUtc: string | null;
  onChange: (date: string, startUtc: string | null, endUtc: string | null) => void;
}) {
  const t = useCopy();
  const weekdays = useCopyArray()('dateTimeWeekdayShort');
  const tz = settings?.salonTimezone ?? 'UTC';

  const today = useMemo(() => formatDateInTz(new Date(), tz), [tz]);
  const maxDate = useMemo(
    () => addDays(today, settings?.maxDaysAheadToBook ?? 30),
    [today, settings],
  );

  const [viewMonth, setViewMonth] = useState(() => date ?? today);
  const selectedDate = date ?? today;

  const serviceIdsKey = serviceIds.join(',');

  // Availability cache: key = `${date}|${technicianId}|${serviceIds.join(',')}`
  const cacheRef = useRef<Map<string, { slots: ApiSlot[]; ts: number }>>(new Map());
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchSlots = useCallback(
    async (forDate: string) => {
      const key = `${forDate}|${technicianId}|${serviceIdsKey}`;
      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.ts < 30_000) {
        setSlots(cached.slots);
        return;
      }
      setLoadingSlots(true);
      try {
        const url = `/api/booking/availability?serviceIds=${encodeURIComponent(serviceIdsKey)}&technicianId=${encodeURIComponent(technicianId)}&date=${encodeURIComponent(forDate)}`;
        const res = await fetch(url);
        const data = await safeJson<{ slots?: ApiSlot[] }>(res);
        const list: ApiSlot[] = Array.isArray(data?.slots) ? data.slots : [];
        cacheRef.current.set(key, { slots: list, ts: Date.now() });
        setSlots(list);
      } catch (err) {
        console.warn('[booking] availability fetch failed', err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [serviceIdsKey, technicianId],
  );

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const monthCells = useMemo(() => buildMonthCells(viewMonth), [viewMonth]);

  function pickDate(d: string) {
    if (d < today || d > maxDate) return;
    onChange(d, null, null);
    fetchSlots(d);
  }

  function pickSlot(slot: ApiSlot) {
    onChange(selectedDate, slot.startUtc, slot.endUtc);
  }

  return (
    <section>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1fr) minmax(220px, 1fr)',
          gap: '1rem',
        }}
      >
        <div className="booking-card booking-card-pad">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.875rem',
            }}
          >
            <button
              type="button"
              className="booking-cta booking-cta--secondary"
              onClick={() => setViewMonth(addMonth(viewMonth, -1))}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <ChevronLeft size={14} />
            </button>
            <h3 className="booking-heading" style={{ fontSize: '1rem', margin: 0 }}>
              {monthLabelFromDate(viewMonth, t('dateTimeMonthFormat'))}
            </h3>
            <button
              type="button"
              className="booking-cta booking-cta--secondary"
              onClick={() => setViewMonth(addMonth(viewMonth, 1))}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="booking-calendar" style={{ marginBottom: '0.5rem' }}>
            {weekdays.map((d, i) => (
              <span key={i} className="booking-calendar-weekday">
                {d}
              </span>
            ))}
            {monthCells.map((cell, i) => (
              <button
                key={i}
                type="button"
                className={`booking-calendar-day${
                  cell?.date === selectedDate ? ' booking-calendar-day--selected' : ''
                }${cell?.date === today ? ' booking-calendar-day--today' : ''}`}
                style={{ visibility: cell ? 'visible' : 'hidden' }}
                disabled={!cell || cell.date < today || cell.date > maxDate}
                onClick={() => cell && pickDate(cell.date)}
              >
                {cell ? cell.day : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="booking-card booking-card-pad">
          <h3 className="booking-heading" style={{ fontSize: '1rem', marginTop: 0 }}>
            {t('dateTimeTimeHeading')}
          </h3>
          <p className="booking-helper" style={{ fontSize: '0.75rem' }}>
            {t('dateTimeTimezoneNote')}
          </p>
          {loadingSlots ? (
            <p className="booking-muted" style={{ marginTop: '1rem' }}>
              …
            </p>
          ) : slots.length === 0 ? (
            <p
              className="booking-helper"
              style={{ marginTop: '1rem', fontSize: '0.875rem' }}
            >
              {t('dateTimeNoSlotsThisDay')}
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '0.5rem',
                marginTop: '0.875rem',
              }}
            >
              {slots.map((slot) => (
                <button
                  key={slot.startUtc}
                  type="button"
                  className={`booking-slot${
                    startUtc === slot.startUtc ? ' booking-slot--selected' : ''
                  }`}
                  onClick={() => pickSlot(slot)}
                >
                  {formatTimeInTz(new Date(slot.startUtc), tz)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function formatDateInTz(date: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date); // en-CA yields "YYYY-MM-DD"
}

function formatTimeInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
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

function addMonth(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    Math.min(d, 28),
  ).padStart(2, '0')}`;
}

interface Cell {
  date: string;
  day: number;
}

function buildMonthCells(monthAnchor: string): Array<Cell | null> {
  const [y, m] = monthAnchor.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const startWeekday = first.getUTCDay(); // 0=Sun
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: Array<Cell | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
    });
  }
  return cells;
}

function monthLabelFromDate(date: string, template: string): string {
  const [y, m] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  const monthName = new Intl.DateTimeFormat('en-NZ', {
    month: 'long',
    timeZone: 'UTC',
  }).format(dt);
  return template.replace('{month}', monthName).replace('{year}', String(y));
}
