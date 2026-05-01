// DELETE /api/booking/recognition  — clears the recognition cookie.
// Used by the "Not you? Use different details" link on the booking wizard.

import { NextResponse } from 'next/server';
import { clearRecognitionCookie } from '@/booking/lib/cookies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE() {
  await clearRecognitionCookie();
  return NextResponse.json({ ok: true });
}
