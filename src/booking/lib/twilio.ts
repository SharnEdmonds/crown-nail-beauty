// Twilio SMS sender. Server-only.
//
// Returns null (instead of throwing) when Twilio credentials are not configured —
// callers should treat that as "SMS disabled".

import 'server-only';

import twilio from 'twilio';

let cached: ReturnType<typeof twilio> | null = null;

export function getTwilio(): ReturnType<typeof twilio> | null {
  if (cached) return cached;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  cached = twilio(sid, token);
  return cached;
}

export function getTwilioFromNumber(): string | null {
  return process.env.TWILIO_FROM_NUMBER || null;
}

/**
 * Normalise a NZ-style phone number to E.164. Accepts:
 *   "022 123 4567"   →  "+64221234567"
 *   "+64 22 123 4567" → "+64221234567"
 *   "021-555-1234"   →  "+64215551234"
 * Returns null if it can't safely parse.
 */
export function toE164NZ(input: string): string | null {
  const stripped = input.replace(/[^\d+]/g, '');
  if (stripped.startsWith('+')) {
    if (/^\+[1-9]\d{6,14}$/.test(stripped)) return stripped;
    return null;
  }
  // No leading +; assume NZ. Strip a leading 0 then prefix +64.
  const noLead = stripped.replace(/^0+/, '');
  if (noLead.length < 7 || noLead.length > 11) return null;
  return `+64${noLead}`;
}
