-- Phase 17.12 — Pre-appointment SMS reminder tracking.
-- Records when (if ever) we sent the 24h-ahead SMS so the cron doesn't double-send.

ALTER TABLE booking_appointments
  ADD COLUMN IF NOT EXISTS sms_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS booking_appointments_sms_reminder_pending_idx
  ON booking_appointments (start_at)
  WHERE status = 'confirmed' AND sms_reminder_sent_at IS NULL;
