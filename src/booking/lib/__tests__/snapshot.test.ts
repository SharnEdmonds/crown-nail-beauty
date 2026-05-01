import { describe, it, expect, vi } from 'vitest';

// `server-only` throws in non-server contexts. Stub it for the test environment.
vi.mock('server-only', () => ({}));

const { buildSnapshot, orderServicesByIds } = await import('../snapshot');
import type { BookingService, Technician } from '../types';

const tech: Pick<Technician, '_id' | 'name'> = { _id: 'tech1', name: 'Sarah' };

const sv = (
  id: string,
  title: string,
  duration: number,
  price: number,
  deposit: number,
  buffer = 0,
  order = 100,
): BookingService =>
  ({
    _id: id,
    _type: 'bookingService',
    title,
    slug: { current: id },
    durationMinutes: duration,
    bufferMinutes: buffer,
    price,
    deposit,
    order,
    isActive: true,
  }) as BookingService;

describe('buildSnapshot', () => {
  it('handles single-service booking', () => {
    const snap = buildSnapshot([sv('s1', 'Manicure', 60, 45, 15, 10)], tech);
    expect(snap.service_sanity_id).toBe('s1');
    expect(snap.additional_service_sanity_ids).toEqual([]);
    expect(snap.service_name_snapshot).toBe('Manicure');
    expect(snap.service_price_cents_snapshot).toBe(4500);
    expect(snap.deposit_cents_snapshot).toBe(1500);
    expect(snap.service_duration_min_snapshot).toBe(60);
    expect(snap.buffer_min_snapshot).toBe(10);
    expect(snap.technician_sanity_id).toBe('tech1');
    expect(snap.technician_name_snapshot).toBe('Sarah');
  });

  it('joins multi-service in input order', () => {
    const snap = buildSnapshot(
      [
        sv('s1', 'Gel Polish', 60, 45, 15, 10),
        sv('s2', 'Lash Set', 90, 75, 25, 15),
      ],
      tech,
    );
    expect(snap.service_sanity_id).toBe('s1'); // first = primary
    expect(snap.additional_service_sanity_ids).toEqual(['s2']);
    expect(snap.service_name_snapshot).toBe('Gel Polish + Lash Set');
    expect(snap.service_price_cents_snapshot).toBe(12000);
    expect(snap.deposit_cents_snapshot).toBe(4000);
    expect(snap.service_duration_min_snapshot).toBe(150);
    // Trailing buffer = the LAST service's buffer.
    expect(snap.buffer_min_snapshot).toBe(15);
  });

  it('respects input order even if Sanity order field differs', () => {
    // s2 has lower order than s1 but caller passed s1 first.
    const snap = buildSnapshot(
      [
        sv('s1', 'A', 60, 45, 15, 10, 100),
        sv('s2', 'B', 60, 45, 15, 10, 5), // lower "order" than A
      ],
      tech,
    );
    // Primary = s1 (input order), NOT s2 (lowest sanity order).
    expect(snap.service_sanity_id).toBe('s1');
    expect(snap.service_name_snapshot).toBe('A + B');
  });

  it('handles 3-service combos', () => {
    const snap = buildSnapshot(
      [
        sv('s1', 'A', 60, 45, 15),
        sv('s2', 'B', 90, 75, 25),
        sv('s3', 'C', 30, 35, 15, 5),
      ],
      tech,
    );
    expect(snap.additional_service_sanity_ids).toEqual(['s2', 's3']);
    expect(snap.service_name_snapshot).toBe('A + B + C');
    expect(snap.service_duration_min_snapshot).toBe(180);
    expect(snap.buffer_min_snapshot).toBe(5); // last service's buffer
  });

  it('throws on empty array', () => {
    expect(() => buildSnapshot([], tech)).toThrow();
  });
});

describe('orderServicesByIds', () => {
  it('reorders fetched services to match input id order', () => {
    const services = [
      sv('s2', 'B', 60, 45, 15),
      sv('s1', 'A', 60, 45, 15),
      sv('s3', 'C', 60, 45, 15),
    ];
    const ordered = orderServicesByIds(['s1', 's2', 's3'], services);
    expect(ordered.map((s) => s._id)).toEqual(['s1', 's2', 's3']);
  });

  it('drops ids that have no matching service', () => {
    const services = [sv('s1', 'A', 60, 45, 15)];
    const ordered = orderServicesByIds(['s1', 'missing'], services);
    expect(ordered.map((s) => s._id)).toEqual(['s1']);
  });
});
