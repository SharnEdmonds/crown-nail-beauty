'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCopy } from '@/booking/lib/context';
import { getSupabaseBrowser } from '@/booking/lib/supabase-browser';

export function AdminShell({
  adminEmail,
  children,
}: {
  adminEmail: string;
  children: React.ReactNode;
}) {
  const t = useCopy();
  const router = useRouter();

  async function signOut() {
    try {
      await getSupabaseBrowser().auth.signOut();
    } catch {
      // ignored
    }
    router.replace('/admin/login');
  }

  return (
    <div className="booking-page" style={{ paddingTop: '1.5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--booking-color-border)',
          }}
        >
          <div>
            <h1 className="booking-heading" style={{ fontSize: '1.5rem', margin: 0 }}>
              {t('adminDashboardTitle')}
            </h1>
            <p
              className="booking-muted"
              style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
            >
              {adminEmail}
            </p>
          </div>
          <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/admin" className="booking-cta booking-cta--secondary" style={{ padding: '0.5rem 0.875rem' }}>
              Dashboard
            </Link>
            <Link
              href="/admin/calendar"
              className="booking-cta booking-cta--secondary"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              Calendar
            </Link>
            <Link
              href="/admin/bookings"
              className="booking-cta booking-cta--secondary"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              {t('adminBookingsTitle')}
            </Link>
            <Link
              href="/admin/customers"
              className="booking-cta booking-cta--secondary"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              {t('adminCustomersTitle')}
            </Link>
            <Link
              href="/admin/refunds"
              className="booking-cta booking-cta--secondary"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              {t('adminRefundsTitle')}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="booking-cta booking-cta--secondary"
              style={{ padding: '0.5rem 0.875rem' }}
            >
              {t('adminSignOutLabel')}
            </button>
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
