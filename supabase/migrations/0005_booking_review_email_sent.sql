-- Phase 17.11 — Post-appointment review email tracking.
-- Records when (if ever) we sent the "how was Sarah?" follow-up so the cron
-- doesn't double-send. Nullable: NULL means "not sent yet".

ALTER TABLE booking_appointments
  ADD COLUMN IF NOT EXISTS review_email_sent_at TIMESTAMPTZ;

-- Indexed on start_at so the cron can scan only candidate windows efficiently.
-- Filtering on status + sent_at IS NULL via WHERE keeps the index slim.
CREATE INDEX IF NOT EXISTS booking_appointments_review_email_pending_idx
  ON booking_appointments (start_at)
  WHERE status = 'confirmed' AND review_email_sent_at IS NULL;
