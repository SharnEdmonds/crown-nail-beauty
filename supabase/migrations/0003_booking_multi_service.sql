-- Phase 16.5 — Multi-service bookings.
--
-- Customers can now select up to 3 services in a single booking. We store the
-- *primary* service in the existing `service_sanity_id` column and any additional
-- services in this new array column. Snapshot fields (name / price / duration /
-- deposit) on the booking row contain the *summed* totals for all selected services.
--
-- Backwards compatible: existing single-service rows have empty arrays.

ALTER TABLE booking_appointments
  ADD COLUMN IF NOT EXISTS additional_service_sanity_ids text[] NOT NULL DEFAULT '{}';
