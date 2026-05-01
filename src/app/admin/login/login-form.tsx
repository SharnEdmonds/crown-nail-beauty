'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/booking/lib/supabase-browser';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      // Send the user to /auth/callback which exchanges the code for a session
      // and then forwards them to /admin.
      const redirectTo = `${window.location.origin}/auth/callback?next=/admin`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });
      if (err) {
        setError(err.message);
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <p style={{ fontSize: '0.9rem', textAlign: 'center', color: 'var(--booking-color-success)' }}>
        Magic link sent. Check your email.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <label className="booking-label" htmlFor="admin-email">
        Email
      </label>
      <input
        id="admin-email"
        type="email"
        className="booking-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
        autoFocus
      />
      <button
        type="submit"
        className="booking-cta"
        disabled={status === 'sending' || !email.includes('@')}
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {error ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--booking-color-error)' }}>{error}</p>
      ) : null}
    </form>
  );
}
