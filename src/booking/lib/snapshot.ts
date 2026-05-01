// Helpers for building booking-row snapshots.
// Snapshots freeze the service / technician data at booking time so subsequent Sanity edits
// do not change historical bookings (price, name, duration, etc.).
//
// Sanity stores money as dollars; the database stores money as cents. Conversion happens here.

import 'server-only';

import { dollarsToCents } from './templating';
import type { BookingService, Technician } from './types';

export interface BookingSnapshot {
  service_sanity_id: string;
  additional_service_sanity_ids: string[];
  service_name_snapshot: string;
  service_price_cents_snapshot: number;
  service_duration_min_snapshot: number;
  buffer_min_snapshot: number;
  deposit_cents_snapshot: number;
  technician_sanity_id: string;
  technician_name_snapshot: string;
}

/**
 * Build a snapshot from one or more services. Single-service bookings still work —
 * they just have a one-item `services` array.
 *
 * Services MUST be passed in the order they should appear in the booking — typically
 * the user's selection order. The first service becomes the "primary" reference;
 * the rest land in `additional_service_sanity_ids`. Callers that fetch services
 * via GROQ `_id in $ids` MUST re-sort the results to match their input id order
 * before passing them in (Sanity returns documents in arbitrary order otherwise).
 *
 * For multi-service:
 *   - service_sanity_id = services[0]._id (the "primary")
 *   - additional_service_sanity_ids = ids 2..n in input order
 *   - name = "A + B + C" (joined in input order)
 *   - price / duration / deposit = summed totals
 *   - buffer = single end-of-block buffer (we don't insert buffer between same-tech same-block services)
 */
export function buildSnapshot(
  services: BookingService[],
  technician: Pick<Technician, '_id' | 'name'>,
): BookingSnapshot {
  if (services.length === 0) {
    throw new Error('buildSnapshot called with empty services array');
  }
  const primary = services[0];
  const rest = services.slice(1);

  const totalDurationMinutes = services.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDeposit = services.reduce((sum, s) => sum + s.deposit, 0);
  const trailingBuffer = services[services.length - 1].bufferMinutes ?? 0;

  const name =
    services.length === 1
      ? primary.title
      : services.map((s) => s.title).join(' + ');

  return {
    service_sanity_id: primary._id,
    additional_service_sanity_ids: rest.map((s) => s._id),
    service_name_snapshot: name,
    service_price_cents_snapshot: dollarsToCents(totalPrice),
    service_duration_min_snapshot: totalDurationMinutes,
    buffer_min_snapshot: trailingBuffer,
    deposit_cents_snapshot: dollarsToCents(totalDeposit),
    technician_sanity_id: technician._id,
    technician_name_snapshot: technician.name,
  };
}

/**
 * Re-order an unsorted `services` array (typically from a GROQ `_id in $ids` fetch)
 * to match the original `serviceIds` request order. Drops any unmatched ids silently
 * — caller should validate `result.length === serviceIds.length` if matching matters.
 */
export function orderServicesByIds(
  serviceIds: string[],
  services: BookingService[],
): BookingService[] {
  const byId = new Map(services.map((s) => [s._id, s]));
  return serviceIds.map((id) => byId.get(id)).filter((s): s is BookingService => Boolean(s));
}
