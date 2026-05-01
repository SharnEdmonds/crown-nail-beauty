'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeJson } from '@/booking/lib/templating';
import { friendlyError } from '@/booking/lib/admin-errors';
import type { Technician } from '@/booking/lib/types';

export function EditBookingModal({
  bookingId,
  serviceIds,
  currentTechId,
  currentNotes,
  technicians,
  onClose,
}: {
  bookingId: string;
  serviceIds: string[];
  currentTechId: string;
  currentNotes: string | null;
  technicians: Technician[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [techId, setTechId] = useState(currentTechId);
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qualifiedTechs = technicians.filter(
    (t) =>
      t.isActive &&
      serviceIds.every((sid) =>
        (t.services as unknown as string[] | undefined)?.includes(sid),
      ),
  );

  const dirty = techId !== currentTechId || (notes ?? '') !== (currentNotes ?? '');

  async function submit() {
    if (!dirty || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/edit`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          notes: notes || null,
          technicianId: techId,
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
        style={{ maxWidth: '32rem' }}
      >
        <h3 className="booking-heading" style={{ fontSize: '1.125rem', marginTop: 0 }}>
          Edit booking
        </h3>
        <p className="booking-helper" style={{ fontSize: '0.85rem' }}>
          Update notes or swap technician (same time). To change the time, use Reschedule instead.
        </p>

        <div style={{ display: 'grid', gap: '0.875rem', marginTop: '1rem' }}>
          <div>
            <label className="booking-label">Technician</label>
            <select
              className="booking-input"
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
            >
              {qualifiedTechs.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="booking-label">Notes</label>
            <textarea
              className="booking-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Allergies, design preferences, anything the technician should know…"
            />
          </div>
          {error ? (
            <p style={{ color: 'var(--booking-color-error)', fontSize: '0.8rem' }}>
              {error}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              disabled={!dirty || busy}
              style={{ flex: 1 }}
            >
              {busy ? '…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
