// Rate limiting for booking endpoints. Backed by Upstash Redis (free tier).
//
// Strategy:
//   - Per-IP: 5 booking-creation attempts per 10 minutes.
//   - Per-phone: 3 pending bookings simultaneously (enforced separately at the DB layer
//     via a query — this file is the IP guard).
//   - Webhook endpoint is NOT rate-limited (Stripe retries are legitimate).

import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let cachedRedis: Redis | null = null;

function getRedis(): Redis {
  if (cachedRedis) return cachedRedis;
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('[booking] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set.');
  }
  cachedRedis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  return cachedRedis;
}

let cachedBookingCreateLimit: Ratelimit | null = null;

export function getBookingCreateRateLimit(): Ratelimit {
  if (cachedBookingCreateLimit) return cachedBookingCreateLimit;
  cachedBookingCreateLimit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    analytics: true,
    prefix: 'booking:create',
  });
  return cachedBookingCreateLimit;
}

/**
 * Best-effort client IP extraction from a Next.js Request.
 * Falls back to a placeholder if no proxy headers are present (single-replica dev).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}
