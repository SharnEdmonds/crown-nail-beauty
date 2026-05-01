import { describe, it, expect } from 'vitest';
import { safeNext } from '../safe-next';

describe('safeNext', () => {
  it('defaults to /admin for null/undefined/empty', () => {
    expect(safeNext(null)).toBe('/admin');
    expect(safeNext(undefined)).toBe('/admin');
    expect(safeNext('')).toBe('/admin');
  });
  it('allows /admin and admin sub-paths', () => {
    expect(safeNext('/admin')).toBe('/admin');
    expect(safeNext('/admin/bookings')).toBe('/admin/bookings');
    expect(safeNext('/admin/bookings/abc-123')).toBe('/admin/bookings/abc-123');
  });
  it('rejects fully qualified URLs', () => {
    expect(safeNext('https://evil.com/admin')).toBe('/admin');
    expect(safeNext('http://evil.com')).toBe('/admin');
  });
  it('rejects protocol-relative URLs', () => {
    expect(safeNext('//evil.com/admin')).toBe('/admin');
  });
  it('rejects relative paths without leading slash', () => {
    expect(safeNext('admin')).toBe('/admin');
    expect(safeNext('foo/bar')).toBe('/admin');
  });
  it('rejects non-admin paths', () => {
    expect(safeNext('/book')).toBe('/admin');
    expect(safeNext('/booking/cancel/abc')).toBe('/admin');
    expect(safeNext('/')).toBe('/admin');
  });
  it('rejects /admin-look-alikes that are different paths', () => {
    expect(safeNext('/administrator')).toBe('/admin');
    expect(safeNext('/admins')).toBe('/admin');
  });
  it('preserves query strings on allowed paths', () => {
    expect(safeNext('/admin?tab=bookings')).toBe('/admin?tab=bookings');
    expect(safeNext('/admin/bookings?status=confirmed')).toBe(
      '/admin/bookings?status=confirmed',
    );
  });
  it('preserves fragments on allowed paths', () => {
    expect(safeNext('/admin/calendar#today')).toBe('/admin/calendar#today');
  });
  it('still rejects look-alikes even with query strings', () => {
    expect(safeNext('/administrator?next=/admin')).toBe('/admin');
  });
});
