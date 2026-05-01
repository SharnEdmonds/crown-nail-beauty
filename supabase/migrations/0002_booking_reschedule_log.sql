-- Phase 16.4 — Admin reschedule audit log.
-- Append-only record of every admin-initiated reschedule. Tracks old + new time + technician
-- so we can audit who moved what. RLS enabled, deny by default (only service-role reads).

CREATE TABLE booking_reschedule_log (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                  UUID NOT NULL REFERENCES booking_appointments(id) ON DELETE RESTRICT,
  admin_email                 TEXT NOT NULL,
  admin_ip                    INET,
  old_start_at                TIMESTAMPTZ NOT NULL,
  old_end_at                  TIMESTAMPTZ NOT NULL,
  old_technician_sanity_id    TEXT NOT NULL,
  new_start_at                TIMESTAMPTZ NOT NULL,
  new_end_at                  TIMESTAMPTZ NOT NULL,
  new_technician_sanity_id    TEXT NOT NULL,
  reason                      TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX booking_reschedule_log_booking_idx
  ON booking_reschedule_log (booking_id);

CREATE INDEX booking_reschedule_log_created_idx
  ON booking_reschedule_log (created_at DESC);

ALTER TABLE booking_reschedule_log ENABLE ROW LEVEL SECURITY;
