'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCopy } from '@/booking/lib/context';
import { formatCents, safeJson } from '@/booking/lib/templating';
import { friendlyError } from '@/booking/lib/admin-errors';
import type { Technician } from '@/booking/lib/types';
import { RescheduleModal } from './RescheduleModal';
import { EditBookingModal } from './EditBookingModal';

export function BookingActions({
  bookingId,
  status,
  refundableCents,
  customerFirstName,
  serviceIds,
  currentTechId,
  currentStartUtc,
  currentNotes,
  technicians,
  tz,
}: {
  bookingId: string;
  status: string;
  refundableCents: number;
  customerFirstName: string;
  serviceIds: string[];
  currentTechId: string;
  currentStartUtc: string;
  currentNotes: string | null;
  technicians: Technician[];
  tz: string;
}) {
  const t = useCopy();
  const router = useRouter();
  const [openModal, setOpenModal] = useState<
    'refund' | 'cancel' | 'reschedule' | 'edit' | null
  >(null);

  return (
    <div className="booking-card booking-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 className="booking-heading" style={{ fontSize: '1rem', marginTop: 0 }}>
        Actions
      </h3>
      {status === 'confirmed' ? (
        <ResendEmailButton bookingId={bookingId} />
      ) : null}
      {status === 'confirmed' ? (
        <button
          type="button"
          className="booking-cta booking-cta--secondary"
          onClick={() => setOpenModal('reschedule')}
        >
          Reschedule
        </button>
      ) : null}
      {(status === 'confirmed' || status === 'pending_payment') ? (
        <button
          type="button"
          className="booking-cta booking-cta--secondary"
          onClick={() => setOpenModal('edit')}
        >
          Edit notes / tech
        </button>
      ) : null}
      {status === 'confirmed' && refundableCents > 0 ? (
        <button
          type="button"
          className="booking-cta"
          onClick={() => setOpenModal('refund')}
        >
          Refund {formatCents(refundableCents)}
        </button>
      ) : null}
      {(status === 'confirmed' || status === 'pending_payment') ? (
        <button
          type="button"
          className="booking-cta booking-cta--secondary"
          onClick={() => setOpenModal('cancel')}
          style={{
            color: 'var(--booking-color-error)',
            borderColor: 'var(--booking-color-error)',
          }}
        >
          {status === 'pending_payment' ? 'Cancel pending booking' : 'Cancel without refund'}
        </button>
      ) : null}
      {!['confirmed', 'pending_payment'].includes(status) ? (
        <p className="booking-muted" style={{ fontSize: '0.8rem' }}>
          No actions available for {status} bookings.
        </p>
      ) : null}

      {openModal === 'refund' ? (
        <ConfirmModal
          title={`Refund booking`}
          prompt={t('adminRefundConfirmationPrompt', { customerName: customerFirstName })}
          requiredText={customerFirstName}
          confirmLabel={t('adminRefundButtonTemplate', { amount: formatCents(refundableCents) })}
          danger
          onClose={() => setOpenModal(null)}
          onConfirm={async (confirmationText) => {
            const res = await fetch('/api/admin/refund', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ bookingId, confirmationText, reason: 'customer_request' }),
            });
            const data = await safeJson<{ error?: string }>(res);
            if (!res.ok) throw new Error(friendlyError(data?.error));
            router.refresh();
          }}
        />
      ) : null}

      {openModal === 'reschedule' ? (
        <RescheduleModal
          bookingId={bookingId}
          serviceIds={serviceIds}
          currentTechId={currentTechId}
          currentStartUtc={currentStartUtc}
          technicians={technicians}
          tz={tz}
          onClose={() => setOpenModal(null)}
        />
      ) : null}

      {openModal === 'edit' ? (
        <EditBookingModal
          bookingId={bookingId}
          serviceIds={serviceIds}
          currentTechId={currentTechId}
          currentNotes={currentNotes}
          technicians={technicians}
          onClose={() => setOpenModal(null)}
        />
      ) : null}

      {openModal === 'cancel' ? (
        <ConfirmModal
          title="Cancel without refund"
          prompt={t('adminCancelConfirmationPrompt')}
          requiredText="CANCEL"
          confirmLabel="Cancel booking"
          danger
          onClose={() => setOpenModal(null)}
          onConfirm={async (confirmationText) => {
            const res = await fetch('/api/admin/cancel', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ bookingId, confirmationText, reason: 'salon_cancelled' }),
            });
            const data = await safeJson<{ error?: string }>(res);
            if (!res.ok) throw new Error(friendlyError(data?.error));
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function ConfirmModal({
  title,
  prompt,
  requiredText,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  title: string;
  prompt: string;
  requiredText: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: (confirmationText: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const matches =
    requiredText.length > 0 &&
    normalize(text) === normalize(requiredText);

  async function submit() {
    if (!matches || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onConfirm(text);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
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
      >
        <h3 className="booking-heading" style={{ fontSize: '1.125rem', marginTop: 0 }}>
          {title}
        </h3>
        <p className="booking-helper" style={{ fontSize: '0.875rem' }}>
          {prompt}
        </p>
        <input
          className="booking-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={requiredText}
          autoFocus
        />
        {err ? (
          <p style={{ color: 'var(--booking-color-error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {err}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
            disabled={!matches || busy}
            style={{
              flex: 1,
              background: danger ? 'var(--booking-color-error)' : undefined,
              borderColor: danger ? 'var(--booking-color-error)' : undefined,
            }}
          >
            {busy ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function ResendEmailButton({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/resend-email`, {
        method: 'POST',
      });
      const data = await safeJson<{ error?: string }>(res);
      if (!res.ok) {
        setError(friendlyError(data?.error));
      } else {
        setDone(true);
        window.setTimeout(() => setDone(false), 3000);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button
        type="button"
        className="booking-cta booking-cta--secondary"
        onClick={send}
        disabled={busy || done}
      >
        {busy ? 'Sending…' : done ? 'Email sent ✓' : 'Resend confirmation email'}
      </button>
      {error ? (
        <p style={{ color: 'var(--booking-color-error)', fontSize: '0.75rem' }}>{error}</p>
      ) : null}
    </div>
  );
}
