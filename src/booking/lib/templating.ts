// {placeholder} substitution for plain strings AND Portable Text trees.
// Unknown placeholders render as empty string and emit a warning (typo doesn't crash production).

import type { PortableTextBlock } from '@sanity/types';

const TOKEN_REGEX = /\{(\w+)\}/g;

export type TemplateVars = Record<string, string | number | undefined | null>;

function warnUnknown(token: string, key: string | undefined) {
  if (typeof window === 'undefined') {
    // Server-side: log via console, will be picked up by Sentry beforeSend scrubbers.
    console.warn(
      `[booking templating] Unknown placeholder "{${token}}"${key ? ` in field "${key}"` : ''}.`,
    );
  } else {
    // Client-side: noisy in dev only.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[booking templating] Unknown placeholder "{${token}}"${key ? ` in field "${key}"` : ''}.`,
      );
    }
  }
}

/**
 * Substitute {placeholder} tokens in a plain string.
 * Unknown placeholders render as empty string with a warning.
 */
export function renderTemplate(
  template: string | undefined | null,
  vars: TemplateVars = {},
  fieldKey?: string,
): string {
  if (!template) return '';
  return template.replace(TOKEN_REGEX, (match, token: string) => {
    if (token in vars) {
      const value = vars[token];
      return value == null ? '' : String(value);
    }
    warnUnknown(token, fieldKey);
    return '';
  });
}

/**
 * Walk a Portable Text tree and substitute tokens in every text span.
 * Returns a NEW tree — does not mutate the input.
 */
export function renderPortableText(
  blocks: PortableTextBlock[] | undefined | null,
  vars: TemplateVars = {},
  fieldKey?: string,
): PortableTextBlock[] {
  if (!blocks || !Array.isArray(blocks)) return [];

  return blocks.map((block) => {
    // Only block-type text blocks have spans we want to substitute in.
    if (block._type !== 'block' || !Array.isArray((block as { children?: unknown }).children)) {
      return block;
    }

    const children = (block as { children: unknown[] }).children.map((child) => {
      if (
        child &&
        typeof child === 'object' &&
        '_type' in child &&
        (child as { _type: string })._type === 'span' &&
        'text' in child
      ) {
        const span = child as { _type: 'span'; text: string; marks?: string[] };
        return { ...span, text: renderTemplate(span.text, vars, fieldKey) };
      }
      return child;
    });

    return { ...block, children } as PortableTextBlock;
  });
}

/**
 * Format cents → "$X.XX" (NZD by default).
 * Internal money representation is always cents — display layer converts here.
 */
export function formatCents(cents: number, currency = 'NZD'): string {
  const amount = (cents / 100).toFixed(2);
  return `$${amount}${currency === 'NZD' ? '' : ` ${currency}`}`;
}

/**
 * Format dollars → "$X.XX" (NZD by default).
 * Use when reading directly from Sanity fields that store dollars.
 */
export function formatDollars(dollars: number, currency = 'NZD'): string {
  return `$${dollars.toFixed(2)}${currency === 'NZD' ? '' : ` ${currency}`}`;
}

/**
 * Convert a dollar amount (e.g. 60 or 60.00 or 60.50) to integer cents.
 * Used at the boundary between Sanity (dollars) and Stripe / DB (cents).
 * Rounds to nearest cent to absorb any floating-point fuzz.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Safely parse a fetch Response as JSON. Returns the parsed body on success, or
 * `{ error: 'bad_response' }` if the body is empty / not JSON / etc. Never throws.
 *
 * Using this instead of bare `await res.json()` avoids "Unexpected end of JSON input"
 * crashes when an upstream API returns an empty body or HTML error page (e.g. dev
 * server hot-reload glitches, transient 500s).
 */
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    return { error: 'no_body' } as unknown as T;
  }
  if (!text) return { error: 'empty_body' } as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: 'bad_response' } as unknown as T;
  }
}
