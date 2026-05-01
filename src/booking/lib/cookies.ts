// Booking customer recognition cookie helpers. Server-only.

import 'server-only';

import { cookies } from 'next/headers';

export const RECOGNITION_COOKIE_NAME = 'crown_customer_token';

export async function readRecognitionCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(RECOGNITION_COOKIE_NAME)?.value ?? null;
}

export async function setRecognitionCookie(customerId: string) {
  const store = await cookies();
  store.set(RECOGNITION_COOKIE_NAME, customerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function clearRecognitionCookie() {
  const store = await cookies();
  store.set(RECOGNITION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
