// /admin/login — magic-link sign in.
// Server component renders the static shell; the form itself is client-side
// because Supabase Auth UI runs in the browser.

import '@/booking/styles/booking.css';
import { client as sanityClient } from '@/sanity/lib/client';
import { BOOKING_THEME_QUERY } from '@/booking/lib/queries';
import { themeCssText } from '@/booking/lib/theme-css';
import { LoginForm } from './login-form';
import type { BookingTheme } from '@/booking/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'The login link is missing its code. Try requesting a new one.',
  exchange_failed:
    "We couldn't verify your login link. It may have expired — request a new one.",
  misconfigured: 'Auth is not configured correctly. Contact support.',
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] ?? null : null;

  const theme = await sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(theme) }} />
      <div className="booking-root">
        <div className="booking-page">
          <div className="booking-shell" style={{ maxWidth: '24rem' }}>
            <h1 className="booking-heading" style={{ fontSize: '1.5rem', textAlign: 'center' }}>
              Admin Sign In
            </h1>
            <p
              className="booking-helper"
              style={{ fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}
            >
              Enter your email — we&apos;ll send you a one-time login link.
            </p>
            {errorMessage ? (
              <div className="booking-error-banner" style={{ marginBottom: '1rem' }}>
                {errorMessage}
              </div>
            ) : null}
            <div className="booking-card booking-card-pad">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
