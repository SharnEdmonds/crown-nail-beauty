// Public booking page. Server component:
//   1. Fetches bookingTheme + bookingCopy + bookingSettings + services + technicians
//   2. Reads recognition cookie (HTTP-only) and looks up the customer (if any)
//   3. Wraps the wizard in BookingProvider + theme <style> tag
//
// Marketing site is unaffected. This route is its own page.

import { Metadata } from 'next';
import '@/booking/styles/booking.css';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_SERVICES_QUERY,
  BOOKING_SETTINGS_QUERY,
  BOOKING_THEME_QUERY,
  TECHNICIANS_QUERY,
} from '@/booking/lib/queries';
import { themeCssText } from '@/booking/lib/theme-css';
import { readRecognitionCookie } from '@/booking/lib/cookies';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { COPY_DEFAULTS } from '@/booking/lib/copy-defaults';
import { renderTemplate } from '@/booking/lib/templating';
import type {
  BookingCopy,
  BookingService,
  BookingSettings,
  BookingTheme,
  Technician,
} from '@/booking/lib/types';
import { BookingPageClient } from '@/booking/components/BookingPageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY);
  return {
    title:
      (copy?.wizardPageTitle && renderTemplate(copy.wizardPageTitle)) ||
      COPY_DEFAULTS.wizardPageTitle,
    description:
      (copy?.wizardPageMetaDescription &&
        renderTemplate(copy.wizardPageMetaDescription)) ||
      COPY_DEFAULTS.wizardPageMetaDescription,
  };
}

export default async function BookPage() {
  const [theme, copy, settings, services, technicians] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
    sanityClient.fetch<BookingSettings | null>(BOOKING_SETTINGS_QUERY),
    sanityClient.fetch<BookingService[]>(BOOKING_SERVICES_QUERY),
    sanityClient.fetch<Technician[]>(TECHNICIANS_QUERY),
  ]);

  // Recognition cookie path
  let recognizedCustomer: { name: string; phone: string; email: string | null } | null = null;
  const customerToken = await readRecognitionCookie();
  if (customerToken) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('booking_customers')
        .select('id, name, phone, email, is_redacted')
        .eq('id', customerToken)
        .single();
      if (data && !data.is_redacted) {
        recognizedCustomer = { name: data.name, phone: data.phone, email: data.email };
      }
    } catch (err) {
      console.warn('[book] recognition lookup failed', (err as Error).message);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(theme) }} />
      <div className="booking-root">
        <BookingPageClient
          copy={copy}
          theme={theme}
          settings={settings}
          services={services}
          technicians={technicians}
          recognizedCustomer={recognizedCustomer}
        />
      </div>
    </>
  );
}
