'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import { BookingProvider, useCopy, useCopyPortableText } from '@/booking/lib/context';
import { safeJson } from '@/booking/lib/templating';
import type { BookingCopy, BookingTheme } from '@/booking/lib/types';
import type { TemplateVars } from '@/booking/lib/templating';

export function SuccessClient({
  copy,
  theme,
  status,
  sessionId,
  vars,
}: {
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  status: string;
  sessionId: string;
  vars: TemplateVars;
}) {
  return (
    <BookingProvider copy={copy} theme={theme}>
      <SuccessInner status={status} sessionId={sessionId} vars={vars} />
    </BookingProvider>
  );
}

function SuccessInner({
  status,
  sessionId,
  vars,
}: {
  status: string;
  sessionId: string;
  vars: TemplateVars;
}) {
  const t = useCopy();
  const ptBody = useCopyPortableText()('successBodyTemplate', vars);
  const ptCancel = useCopyPortableText()('successCancellationNote', vars);
  const router = useRouter();

  // Poll the server for confirmation, but only refresh the route when the
  // status actually flips to "confirmed". We refresh (server-side re-render)
  // exactly once — never reload — to pull fresh booking data including the
  // recognition cookie + customer name.
  const [currentStatus, setCurrentStatus] = useState(status);
  const refreshedOnce = useRef(false);

  useEffect(() => {
    // Already confirmed when the page rendered: nothing to do.
    if (currentStatus === 'confirmed') return;
    // Only allow the polling effect to trigger one refresh per page load.
    if (refreshedOnce.current) return;

    let cancelled = false;
    const intervalId = window.setInterval(async () => {
      try {
        const res = await fetch(
          `/api/booking/session-status?session_id=${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' },
        );
        const data = await safeJson<{ status?: string }>(res);
        if (cancelled) return;
        if (data?.status && data.status !== currentStatus) {
          setCurrentStatus(data.status);
          if (data.status === 'confirmed' && !refreshedOnce.current) {
            refreshedOnce.current = true;
            // Server re-render so the page picks up the cookie + customer name.
            router.refresh();
          }
        }
      } catch {
        // Ignore transient errors; the next tick will retry.
      }
    }, 3000);

    // Stop polling after 30s either way; user can manually reload if needed.
    const timeoutId = window.setTimeout(() => {
      cancelled = true;
      window.clearInterval(intervalId);
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
    // currentStatus is intentional — when it flips to 'confirmed' the effect bails out.
  }, [currentStatus, sessionId, router]);

  return (
    <div className="booking-card booking-card-pad" style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '3rem',
          height: '3rem',
          borderRadius: 'var(--booking-radius-full)',
          background: 'var(--booking-color-accent-muted)',
          color: 'var(--booking-color-accent)',
          marginBottom: '1rem',
        }}
      >
        <CheckCircle2 size={28} />
      </div>
      <h1 className="booking-heading" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {t('successHeading')}
      </h1>
      <p className="booking-helper" style={{ marginBottom: '1.5rem' }}>
        {t('successSubheading', vars)}
      </p>
      {ptBody.length > 0 ? (
        <div style={{ textAlign: 'left' }}>
          <PortableText value={ptBody} />
        </div>
      ) : null}
      {ptCancel.length > 0 ? (
        <div
          className="booking-helper"
          style={{
            marginTop: '1.25rem',
            fontSize: '0.8125rem',
            textAlign: 'left',
            background: 'var(--booking-color-surface-muted)',
            padding: '0.875rem',
            borderRadius: 'var(--booking-radius-md)',
          }}
        >
          <PortableText value={ptCancel} />
        </div>
      ) : null}
      {currentStatus !== 'confirmed' ? (
        <p
          className="booking-helper"
          style={{ fontSize: '0.75rem', marginTop: '1rem' }}
        >
          We&apos;re finalising your payment…
        </p>
      ) : null}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginTop: '1.75rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" className="booking-cta booking-cta--secondary">
          Return to homepage
        </Link>
        <Link href="/book" className="booking-cta">
          Book another
        </Link>
      </div>
    </div>
  );
}
