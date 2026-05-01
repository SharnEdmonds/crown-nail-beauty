'use client';

import { useState } from 'react';
import { PortableText } from '@portabletext/react';
import { BookingProvider, useCopy, useCopyPortableText } from '@/booking/lib/context';
import { safeJson } from '@/booking/lib/templating';
import type { BookingCopy, BookingTheme } from '@/booking/lib/types';
import type { TemplateVars } from '@/booking/lib/templating';

export function CancelClient({
  copy,
  theme,
  token,
  alreadyUsed,
  pastCutoff,
  vars,
}: {
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  token: string;
  alreadyUsed: boolean;
  pastCutoff: boolean;
  vars: TemplateVars;
}) {
  return (
    <BookingProvider copy={copy} theme={theme}>
      <CancelInner
        token={token}
        alreadyUsed={alreadyUsed}
        pastCutoff={pastCutoff}
        vars={vars}
      />
    </BookingProvider>
  );
}

function CancelInner({
  token,
  alreadyUsed,
  pastCutoff,
  vars,
}: {
  token: string;
  alreadyUsed: boolean;
  pastCutoff: boolean;
  vars: TemplateVars;
}) {
  const t = useCopy();
  const ptBody = useCopyPortableText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');

  if (alreadyUsed) {
    return (
      <div className="booking-card booking-card-pad">
        <h1 className="booking-heading" style={{ fontSize: '1.5rem' }}>
          {t('cancelAlreadyUsedHeading')}
        </h1>
        <PortableText value={ptBody('cancelAlreadyUsedBody', vars)} />
      </div>
    );
  }
  if (pastCutoff) {
    return (
      <div className="booking-card booking-card-pad">
        <h1 className="booking-heading" style={{ fontSize: '1.5rem' }}>
          {t('cancelTooLateHeading')}
        </h1>
        <PortableText value={ptBody('cancelTooLateBody', vars)} />
      </div>
    );
  }
  if (done) {
    const successVars = { ...vars, refundAmount: refundAmount || vars.refundAmount };
    return (
      <div className="booking-card booking-card-pad">
        <h1 className="booking-heading" style={{ fontSize: '1.5rem' }}>
          {t('cancelSuccessHeading')}
        </h1>
        <PortableText value={ptBody('cancelSuccessBody', successVars)} />
      </div>
    );
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking/cancel/${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      const data = await safeJson<{ error?: string; refundAmount?: number }>(res);
      if (!res.ok) {
        setError(data?.error ?? 'failed');
        setBusy(false);
        return;
      }
      if (typeof data?.refundAmount === 'number') {
        const amt = (data.refundAmount / 100).toFixed(2);
        setRefundAmount(`$${amt}`);
      }
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="booking-card booking-card-pad">
      <h1 className="booking-heading" style={{ fontSize: '1.5rem' }}>
        {t('cancelHeading')}
      </h1>
      <PortableText value={ptBody('cancelConfirmBody', vars)} />
      {error ? (
        <p style={{ color: 'var(--booking-color-error)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
          {t('errorsGeneric')}
        </p>
      ) : null}
      <button
        type="button"
        onClick={confirm}
        disabled={busy}
        className="booking-cta"
        style={{ width: '100%', marginTop: '1.5rem' }}
      >
        {busy ? 'Processing your refund…' : t('cancelConfirmButton', vars)}
      </button>
      {busy ? (
        <p
          className="booking-helper"
          style={{ fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center' }}
        >
          Please don&apos;t close this tab. This usually takes 5–10 seconds.
        </p>
      ) : null}
    </div>
  );
}
