'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeJson } from '@/booking/lib/templating';
import { friendlyError } from '@/booking/lib/admin-errors';
import type { Technician } from '@/booking/lib/types';

interface ApiSlot {
  startUtc: string;
  endUtc: string;
}

export function RescheduleModal({
  bookingId,
  serviceIds,
  currentTechId,
  currentStartUtc,
  technicians,
  tz,
  onClose,
}: {
  bookingId: string;
  serviceIds: string[];
  currentTechId: string;
  currentStartUtc: string;
  technicians: Technician[];
  tz: string;
  onClose: () => void;
}) {
  const router = useRouter();

  // Tech is qualified iff they perform every service.
  const qualifiedTechs = useMemo(
    () =>
      technicians.filter(
        (t) =>
          t.isActive &&
          serviceIds.every((sid) =>
            (t.services as unknown as string[] | undefined)?.includes(sid),
          ),
      ),
    [technicians, serviceIds],
  );

  const currentTechIsQualified = qualifiedTechs.some((t) => t._id === currentTechId);

  // If the booking's current tech is no longer active or no longer qualified for the
  // service combo, default to the first qualified tech (if any) and surface a banner.
  const [techId, setTechId] = useState<string>(
    currentTechIsQualified ? currentTechId : qualifiedTechs[0]?._id ?? '',
  );
  const [date, setDate] = useState<string>(formatDateInTz(new Date(currentStartUtc), tz));
  const [startUtc, setStartUtc] = useState<string>('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!techId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/booking/availability?serviceIds=${encodeURIComponent(serviceIds.join(','))}&technicianId=${encodeURIComponent(techId)}&date=${encodeURIComponent(date)}&excludeBookingId=${encodeURIComponent(bookingId)}`,
    )
      .then((r) => safeJson<{ slots?: ApiSlot[] }>(r))
      .then((data) => {
        if (!cancelled) setSlots(Array.isArray(data?.slots) ? data.slots : []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [techId, date, serviceIds]);

  async function submit() {
    if (!techId || !date || !startUtc) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          newTechnicianId: techId,
          newDate: date,
          newStartUtc: startUtc,
          reason: reason || undefined,
        }),
      });
      const data = await safeJson<{ error?: string }>(res);
      if (!res.ok) {
        setError(friendlyError(data?.error));
        setBusy(false);
        return;
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="booking-modal-backdrop" onClick={onClose}>
      <div
        className="booking-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        style={{ maxWidth: '36rem' }}
      >
        <h3 className="booking-heading" style={{ fontSize: '1.125rem', marginTop: 0 }}>
          Reschedule booking
        </h3>
        <p className="booking-helper" style={{ fontSize: '0.85rem' }}>
          Pick a new technician, date, and time. The customer will be emailed about the change.
          Their deposit stays attached — no refund or recharge.
        </p>
        {!currentTechIsQualified ? (
          <div
            className="booking-error-banner"
            style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
          >
            The original technician is no longer available for this service combo. Pick another.
          </div>
        ) : null}
        {qualifiedTechs.length === 0 ? (
          <div
            className="booking-error-banner"
            style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
          >
            No active technicians can perform every service in this booking. Cancel and rebook,
            or update technician skills in Studio first.
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: '0.875rem', marginTop: '1rem' }}>
          <div>
            <label className="booking-label">Technician</label>
            <select
              className="booking-input"
              value={techId}
              onChange={(e) => {
                setTechId(e.target.value);
                setStartUtc('');
              }}
            >
              {qualifiedTechs.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="booking-label">Date</label>
            <input
              type="date"
              className="booking-input"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setStartUtc('');
              }}
            />
          </div>
          <div>
            <label className="booking-label">Time</label>
            {loading ? (
              <p className="booking-muted">…</p>
            ) : slots.length === 0 ? (
              <p className="booking-helper" style={{ fontSize: '0.85rem' }}>
                No availability that day for this tech.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '0.4rem',
                }}
              >
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.startUtc}
                    className={`booking-slot${
                      startUtc === slot.startUtc ? ' booking-slot--selected' : ''
                    }`}
                    onClick={() => setStartUtc(slot.startUtc)}
                  >
                    {formatTime(slot.startUtc, tz)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="booking-label">Reason (optional)</label>
            <input
              type="text"
              className="booking-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="e.g. Sarah is sick"
            />
          </div>
          {error ? (
            <p style={{ color: 'var(--booking-color-error)', fontSize: '0.8rem' }}>
              {error}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="booking-cta booking-cta--secondary"
              onClick={onClose}
              disabled={busy}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="booking-cta"
              onClick={submit}
              disabled={!startUtc || busy}
              style={{ flex: 1 }}
            >
              {busy ? '…' : 'Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateInTz(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function formatTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
