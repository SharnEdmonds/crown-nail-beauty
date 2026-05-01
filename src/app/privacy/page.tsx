// /privacy — privacy policy. Content from bookingSettings.privacyPolicyText (Portable Text).
// Theme + copy driven so owner can update content + appearance via Sanity.

import { PortableText } from '@portabletext/react';
import '@/booking/styles/booking.css';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { themeCssText } from '@/booking/lib/theme-css';
import type {
  BookingSettings,
  BookingTheme,
} from '@/booking/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Privacy Policy',
};

export default async function PrivacyPage() {
  const [theme, settings] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
  ]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(theme) }} />
      <div className="booking-root">
        <main className="booking-page">
          <article className="booking-shell" style={{ maxWidth: '44rem' }}>
            <h1 className="booking-heading" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
              Privacy Policy
            </h1>
            <div
              className="booking-card booking-card-pad"
              style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
            >
              {settings?.privacyPolicyText && settings.privacyPolicyText.length > 0 ? (
                <PortableText value={settings.privacyPolicyText} />
              ) : (
                <p>
                  Privacy policy not yet configured. Please update Sanity Studio →
                  Booking Settings → Privacy policy.
                </p>
              )}
            </div>
          </article>
        </main>
      </div>
    </>
  );
}
