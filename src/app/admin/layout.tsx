// Admin layout — provides theme + copy + admin shell.
// The actual auth gate is in src/middleware.ts which runs before this layout
// renders, so by the time we get here either the user is authenticated AND
// allowlisted, OR they're on /admin/login (which doesn't include the AdminShell).

import '@/booking/styles/booking.css';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  BOOKING_COPY_QUERY,
  BOOKING_THEME_QUERY,
} from '@/booking/lib/queries';
import { themeCssText } from '@/booking/lib/theme-css';
import { getAdminSession } from '@/booking/lib/auth';
import { BookingProvider } from '@/booking/lib/context';
import { AdminShell } from '@/booking/components/admin/AdminShell';
import type { BookingCopy, BookingTheme } from '@/booking/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const [theme, copy] = await Promise.all([
    sanityClient.fetch<BookingTheme | null>(BOOKING_THEME_QUERY),
    sanityClient.fetch<BookingCopy | null>(BOOKING_COPY_QUERY),
  ]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(theme) }} />
      <div className="booking-root">
        <BookingProvider copy={copy} theme={theme}>
          {session ? (
            <AdminShell adminEmail={session.email}>{children}</AdminShell>
          ) : (
            children
          )}
        </BookingProvider>
      </div>
    </>
  );
}
