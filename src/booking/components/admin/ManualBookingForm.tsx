'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeJson } from '@/booking/lib/templating';
import { friendlyError } from '@/booking/lib/admin-errors';
import type {
  BookingService,
  BookingSettings,
  Technician,
} from '@/booking/lib/types';

interface ApiSlot {
  startUtc: string;
  endUtc: string;
}

export function ManualBookingForm({
  services,
  technicians,
  settings,
}: {
  services: BookingService[];
  technicians: Technician[];
  settings: BookingSettings | null;
}) {
  const router = useRouter();
  const tz = settings?.salonTimezone ?? 'UTC';

  const [serviceId, setServiceId] = useState<string>('');
  const [techId, setTechId] = useState<string>('');
  const [date, setDate] = useState<string>(formatDateInTz(new Date(), tz));
  const [startUtc, setStartUtc] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'in_store' | 'comp'>('in_store');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qualifiedTechs = useMemo(() => {
    if (!serviceId) return [];
    return technicians.filter((t) =>
      (t.services as unknown as string[] | undefined)?.includes(serviceId),
    );
  }, [serviceId, technicians]);

  useEffect(() => {
    if (!serviceId || !techId || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(
      `/api/booking/availability?serviceIds=${encodeURIComponent(serviceId)}&technicianId=${encodeURIComponent(techId)}&date=${encodeURIComponent(date)}`,
    )
      .then((r) => safeJson<{ slots?: ApiSlot[] }>(r))
      .then((data) => setSlots(Array.isArray(data?.slots) ? data.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, techId, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/bookings/new', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serviceIds: [serviceId],
          technicianId: techId,
          date,
          startUtc,
          paymentMethod,
          customer: { name, phone, email, notes },
        }),
      });
      const data = await safeJson<{ error?: string; bookingId?: string }>(res);
      if (!res.ok) {
        setError(friendlyError(data?.error));
        setSubmitting(false);
        return;
      }
      router.push(`/admin/bookings/${data.bookingId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="booking-card booking-card-pad">
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label className="booking-label">Service</label>
          <select
            className="booking-input"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setTechId('');
              setStartUtc('');
            }}
            required
          >
            <option value="">— select —</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title} · {s.durationMinutes}min
              </option>
            ))}
          </select>
        </div>

        {serviceId ? (
          <div>
            <label className="booking-label">Technician</label>
            <select
              className="booking-input"
              value={techId}
              onChange={(e) => {
                setTechId(e.target.value);
                setStartUtc('');
              }}
              required
            >
              <option value="">— select —</option>
              {qualifiedTechs.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {techId ? (
          <>
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
                required
              />
            </div>
            <div>
              <label className="booking-label">Time</label>
              {loadingSlots ? (
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
                      {formatTimeInTz(new Date(slot.startUtc), tz)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

        <hr style={{ border: 0, borderTop: '1px solid var(--booking-color-border)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="booking-label">Customer name</label>
            <input
              type="text"
              className="booking-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="booking-label">Phone</label>
            <input
              type="tel"
              className="booking-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="booking-label">Email (optional)</label>
          <input
            type="email"
            className="booking-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="booking-label">Notes (optional)</label>
          <textarea
            className="booking-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <label className="booking-label">Payment method</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="radio"
                name="payment"
                value="in_store"
                checked={paymentMethod === 'in_store'}
                onChange={() => setPaymentMethod('in_store')}
              />
              Pay in store
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="radio"
                name="payment"
                value="comp"
                checked={paymentMethod === 'comp'}
                onChange={() => setPaymentMethod('comp')}
              />
              Comp (no charge)
            </label>
          </div>
        </div>

        {error ? (
          <p style={{ color: 'var(--booking-color-error)', fontSize: '0.85rem' }}>{error}</p>
        ) : null}

        <button
          type="submit"
          className="booking-cta"
          disabled={submitting || !serviceId || !techId || !startUtc || !name || !phone}
        >
          {submitting ? 'Creating…' : 'Create booking'}
        </button>
      </div>
    </form>
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

function formatTimeInTz(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}
