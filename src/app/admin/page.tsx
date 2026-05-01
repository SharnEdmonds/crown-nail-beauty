// /admin — dashboard summary with rich stats.

import Link from 'next/link';
import { getSupabaseAdmin } from '@/booking/lib/supabase-server';
import { formatCents } from '@/booking/lib/templating';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    confirmedTotalRes,
    pendingTotalRes,
    weekTotalRes,
    weekRevenueRes,
    last30DaysRes,
    customerCountRes,
  ] = await Promise.all([
    supabase
      .from('booking_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed'),
    supabase
      .from('booking_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_payment')
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('booking_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('start_at', todayStart)
      .lte('start_at', sevenDays),
    // "Revenue this week" = deposits actually paid in the last 7 days.
    // Filtering on created_at (not start_at) — that's when the money came in.
    supabase
      .from('booking_appointments')
      .select('amount_paid_cents')
      .eq('status', 'confirmed')
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('booking_appointments')
      .select('technician_name_snapshot, service_name_snapshot, customer_id, status')
      .eq('status', 'confirmed')
      .gte('start_at', thirtyDaysAgo),
    supabase
      .from('booking_customers')
      .select('id, visit_count'),
  ]);

  const weekRevenueCents = (weekRevenueRes.data ?? []).reduce(
    (sum, r) => sum + (r.amount_paid_cents ?? 0),
    0,
  );

  // Top techs (by booking count, last 30 days, confirmed only)
  const techCounts = new Map<string, number>();
  for (const row of last30DaysRes.data ?? []) {
    techCounts.set(
      row.technician_name_snapshot,
      (techCounts.get(row.technician_name_snapshot) ?? 0) + 1,
    );
  }
  const topTechs = Array.from(techCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Top services (last 30 days, confirmed only)
  const svcCounts = new Map<string, number>();
  for (const row of last30DaysRes.data ?? []) {
    svcCounts.set(
      row.service_name_snapshot,
      (svcCounts.get(row.service_name_snapshot) ?? 0) + 1,
    );
  }
  const topServices = Array.from(svcCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Repeat-customer rate. Denominator is customers who actually completed at
  // least one visit (visit_count >= 1) — not the full table, which includes
  // ghost rows from never-confirmed bookings inflating the denominator.
  const allCustomers = customerCountRes.data ?? [];
  const visitedCustomers = allCustomers.filter((c) => (c.visit_count ?? 0) >= 1);
  const repeatCustomers = allCustomers.filter((c) => (c.visit_count ?? 0) >= 2).length;
  const repeatRate =
    visitedCustomers.length > 0
      ? Math.round((repeatCustomers / visitedCustomers.length) * 100)
      : 0;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <Stat label="Next 7 days" value={String(weekTotalRes.count ?? 0)} />
        <Stat
          label="Deposits (last 7 days)"
          value={formatCents(weekRevenueCents)}
          subtle="excludes balance paid in salon"
        />
        <Stat label="Pending (24h)" value={String(pendingTotalRes.count ?? 0)} />
        <Stat label="All-time confirmed" value={String(confirmedTotalRes.count ?? 0)} />
        <Stat
          label="Customers"
          value={String(visitedCustomers.length)}
          subtle={`${repeatRate}% are repeat`}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="booking-card booking-card-pad">
          <h3
            className="booking-heading"
            style={{ fontSize: '0.9rem', marginTop: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Top technicians (last 30 days)
          </h3>
          {topTechs.length === 0 ? (
            <p className="booking-muted" style={{ fontSize: '0.85rem' }}>
              No bookings yet.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {topTechs.map(([name, count]) => (
                <li
                  key={name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid var(--booking-color-border)',
                  }}
                >
                  <span>{name}</span>
                  <span style={{ color: 'var(--booking-color-accent)' }}>{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="booking-card booking-card-pad">
          <h3
            className="booking-heading"
            style={{ fontSize: '0.9rem', marginTop: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Top services (last 30 days)
          </h3>
          {topServices.length === 0 ? (
            <p className="booking-muted" style={{ fontSize: '0.85rem' }}>
              No bookings yet.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {topServices.map(([name, count]) => (
                <li
                  key={name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid var(--booking-color-border)',
                  }}
                >
                  <span style={{ flex: 1, marginRight: '0.5rem' }}>{name}</span>
                  <span style={{ color: 'var(--booking-color-accent)' }}>{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="booking-card booking-card-pad">
        <h3 className="booking-heading" style={{ fontSize: '1.1rem', marginTop: 0 }}>
          Quick actions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/admin/calendar" className="booking-cta booking-cta--secondary" style={{ width: '100%' }}>
            Open calendar
          </Link>
          <Link href="/admin/bookings" className="booking-cta booking-cta--secondary" style={{ width: '100%' }}>
            View all bookings
          </Link>
          <Link href="/admin/bookings/new" className="booking-cta" style={{ width: '100%' }}>
            + New manual booking
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, subtle }: { label: string; value: string; subtle?: string }) {
  return (
    <div className="booking-card booking-card-pad">
      <p
        className="booking-helper"
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginTop: 0,
        }}
      >
        {label}
      </p>
      <p
        className="booking-heading"
        style={{ fontSize: '1.75rem', margin: '0.25rem 0 0', color: 'var(--booking-color-accent)' }}
      >
        {value}
      </p>
      {subtle ? (
        <p className="booking-muted" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
          {subtle}
        </p>
      ) : null}
    </div>
  );
}
