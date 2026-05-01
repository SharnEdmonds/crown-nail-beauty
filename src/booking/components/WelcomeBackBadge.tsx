'use client';

import { useCopy } from '@/booking/lib/context';
import { useState } from 'react';

export function WelcomeBackBadge({ firstName }: { firstName: string }) {
  const t = useCopy();
  const [clearing, setClearing] = useState(false);

  async function handleNotMe() {
    setClearing(true);
    try {
      await fetch('/api/booking/recognition', { method: 'DELETE' });
    } catch {
      // ignored
    }
    window.location.reload();
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
      <span className="booking-welcome-back">{t('wizardWelcomeBackTemplate', { firstName })}</span>
      <button
        type="button"
        onClick={handleNotMe}
        disabled={clearing}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          color: 'var(--booking-color-text-muted)',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        {t('wizardNotYouLink', { firstName })}
      </button>
    </div>
  );
}
