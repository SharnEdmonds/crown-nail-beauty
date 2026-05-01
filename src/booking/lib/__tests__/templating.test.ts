import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  renderPortableText,
  formatCents,
  formatDollars,
  dollarsToCents,
  safeJson,
} from '../templating';

describe('renderTemplate', () => {
  it('substitutes simple {tokens}', () => {
    expect(renderTemplate('Hi {firstName}, see you {date}', { firstName: 'Sarah', date: 'Tuesday' })).toBe(
      'Hi Sarah, see you Tuesday',
    );
  });
  it('handles multiple occurrences of the same token', () => {
    expect(renderTemplate('{x} and {x} again', { x: 'one' })).toBe('one and one again');
  });
  it('renders empty string for missing tokens', () => {
    // Implementation: unknown placeholders render empty (with a warning).
    expect(renderTemplate('Hi {missing}!', {})).toBe('Hi !');
  });
  it('returns empty string for null/undefined input', () => {
    expect(renderTemplate(null, {})).toBe('');
    expect(renderTemplate(undefined, {})).toBe('');
  });
  it('coerces numeric vars to string', () => {
    expect(renderTemplate('{n}', { n: 42 })).toBe('42');
  });
  it('treats null vars as empty', () => {
    expect(renderTemplate('Hi {x}!', { x: null })).toBe('Hi !');
  });
});

describe('renderPortableText', () => {
  it('substitutes inside span text', () => {
    const blocks = [
      {
        _type: 'block',
        children: [{ _type: 'span', text: 'Hi {firstName}', marks: [] }],
      },
    ] as unknown as Parameters<typeof renderPortableText>[0];
    const result = renderPortableText(blocks, { firstName: 'Sarah' });
    expect((result[0] as { children: { text: string }[] }).children[0].text).toBe('Hi Sarah');
  });
  it('returns [] for null input', () => {
    expect(renderPortableText(null)).toEqual([]);
    expect(renderPortableText(undefined)).toEqual([]);
  });
  it('preserves non-block nodes untouched', () => {
    const blocks = [{ _type: 'image', asset: { _ref: 'foo' } }] as never;
    const result = renderPortableText(blocks);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ _type: 'image', asset: { _ref: 'foo' } });
  });
});

describe('formatCents', () => {
  it('formats whole dollars', () => {
    expect(formatCents(6000)).toBe('$60.00');
  });
  it('formats with cents', () => {
    expect(formatCents(6075)).toBe('$60.75');
  });
  it('formats zero', () => {
    expect(formatCents(0)).toBe('$0.00');
  });
  it('appends non-NZD currency', () => {
    expect(formatCents(6000, 'AUD')).toBe('$60.00 AUD');
  });
});

describe('formatDollars', () => {
  it('formats whole dollars', () => {
    expect(formatDollars(60)).toBe('$60.00');
  });
  it('formats decimal dollars', () => {
    expect(formatDollars(60.5)).toBe('$60.50');
  });
});

describe('dollarsToCents', () => {
  it('converts whole dollars', () => {
    expect(dollarsToCents(60)).toBe(6000);
  });
  it('converts decimals correctly', () => {
    expect(dollarsToCents(60.5)).toBe(6050);
  });
  it('rounds floating-point fuzz', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — we want clean cents.
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });
});

describe('safeJson', () => {
  it('returns parsed body for valid JSON', async () => {
    const res = new Response(JSON.stringify({ ok: true, n: 5 }));
    const data = await safeJson<{ ok: boolean; n: number }>(res);
    expect(data).toEqual({ ok: true, n: 5 });
  });
  it('returns sentinel error for empty body', async () => {
    const res = new Response('');
    const data = await safeJson<{ error?: string }>(res);
    expect(data.error).toBe('empty_body');
  });
  it('returns sentinel error for non-JSON body', async () => {
    const res = new Response('<!doctype html>...');
    const data = await safeJson<{ error?: string }>(res);
    expect(data.error).toBe('bad_response');
  });
});
