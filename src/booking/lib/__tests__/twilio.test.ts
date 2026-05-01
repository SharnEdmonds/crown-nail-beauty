import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { toE164NZ } = await import('../twilio');

describe('toE164NZ', () => {
  it('converts NZ mobile with leading 0 + spaces', () => {
    expect(toE164NZ('022 123 4567')).toBe('+64221234567');
  });
  it('converts NZ mobile with leading 0 + dashes', () => {
    expect(toE164NZ('021-555-1234')).toBe('+64215551234');
  });
  it('passes through valid E.164', () => {
    expect(toE164NZ('+64221234567')).toBe('+64221234567');
  });
  it('handles +64 with spaces', () => {
    expect(toE164NZ('+64 22 123 4567')).toBe('+64221234567');
  });
  it('rejects too-short numbers', () => {
    expect(toE164NZ('123')).toBeNull();
  });
  it('rejects malformed E.164', () => {
    expect(toE164NZ('+0123')).toBeNull();
  });
  it('strips multiple leading zeros', () => {
    expect(toE164NZ('00211234567')).toBe('+64211234567');
  });
});
