'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeJson } from '@/booking/lib/templating';
import { friendlyError } from '@/booking/lib/admin-errors';

export function CustomerActions({
  customerId,
  isRedacted,
}: {
  customerId: string;
  isRedacted: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="booking-card booking-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 className="booking-heading" style={{ fontSize: '1rem', marginTop: 0 }}>
        Privacy
      </h3>
      {isRedacted ? (
        <p className="booking-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
          Already redacted. No further action available.
        </p>
      ) : (
        <>
          <p className="booking-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
            Permanently remove this customer&apos;s personal data (Privacy Act 2020).
            Booking history remains as a financial record.
          </p>
          <button
            type="button"
            className="booking-cta booking-cta--secondary"
            onClick={() => setOpen(true)}
            style={{
              color: 'var(--booking-color-error)',
              borderColor: 'var(--booking-color-error)',
            }}
          >
            Redact customer
          </button>
        </>
      )}
      {open ? <RedactModal customerId={customerId} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function RedactModal({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = text.trim().toUpperCase() === 'REDACT';

  async function submit() {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/redact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmationText: text }),
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
      >
        <h3 className="booking-heading" style={{ fontSize: '1.125rem', marginTop: 0 }}>
          Redact customer
        </h3>
        <p className="booking-helper" style={{ fontSize: '0.85rem' }}>
          This permanently removes the customer&apos;s name, phone, and email from
          our records. Their bookings stay on file (financial requirement) but
          show "REDACTED" instead of identifying information. The action cannot
          be undone.
        </p>
        <p className="booking-helper" style={{ fontSize: '0.85rem' }}>
          Type <strong>REDACT</strong> to confirm.
        </p>
        <input
          className="booking-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="REDACT"
          autoFocus
        />
        {error ? (
          <p style={{ color: 'var(--booking-color-error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {error}
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
              background: 'var(--booking-color-error)',
              borderColor: 'var(--booking-color-error)',
            }}
          >
            {busy ? '…' : 'Redact'}
          </button>
        </div>
      </div>
    </div>
  );
}
