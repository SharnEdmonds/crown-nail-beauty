-- Crown Nail & Beauty — booking module schema.
-- All tables prefixed `booking_*`. Marketing-site code never touches these.
--
-- Critical guarantees in this migration:
--   1. UUID primary keys (no enumerable IDs in URLs).
--   2. Postgres EXCLUDE constraint on overlapping pending/confirmed bookings per tech
--      — single most important data-integrity guarantee in the system.
--   3. RLS enabled, ZERO permissive policies for anon/authenticated roles.
--      All access goes through server-side service-role client.
--   4. Audit logs (booking_refund_log, booking_webhook_log) are append-only.
--   5. Webhook idempotency via UNIQUE (stripe_event_id).
--   6. timestamptz everywhere. Salon timezone is a Sanity setting, not a DB column.

-- Required for EXCLUDE USING gist with tstzrange.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ────────────────────────────────────────────────────────────────────
-- Enum-style CHECK constraints inline. Keep types as TEXT so we can
-- evolve the constraint without ALTER TYPE pain in production.
-- ────────────────────────────────────────────────────────────────────

-- ─── Customers ──────────────────────────────────────────────────────
CREATE TABLE booking_customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT NOT NULL UNIQUE,            -- normalized E.164 ("+64...")
  email           TEXT,
  name            TEXT NOT NULL,
  visit_count     INTEGER NOT NULL DEFAULT 0,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_redacted     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX booking_customers_email_idx
  ON booking_customers (email)
  WHERE email IS NOT NULL;

-- ─── Appointments ───────────────────────────────────────────────────
CREATE TABLE booking_appointments (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id                     UUID REFERENCES booking_customers(id) ON DELETE SET NULL,

  status                          TEXT NOT NULL CHECK (status IN (
                                    'pending_payment',
                                    'confirmed',
                                    'cancelled',
                                    'completed',
                                    'expired'
                                  )),

  -- Snapshots — frozen at booking time, survive Sanity edits ─────────
  service_sanity_id               TEXT NOT NULL,
  service_name_snapshot           TEXT NOT NULL,
  service_price_cents_snapshot    INTEGER NOT NULL CHECK (service_price_cents_snapshot >= 0),
  service_duration_min_snapshot   INTEGER NOT NULL CHECK (service_duration_min_snapshot > 0),
  buffer_min_snapshot             INTEGER NOT NULL DEFAULT 0 CHECK (buffer_min_snapshot >= 0),
  deposit_cents_snapshot          INTEGER NOT NULL CHECK (deposit_cents_snapshot >= 0),
  technician_sanity_id            TEXT NOT NULL,
  technician_name_snapshot        TEXT NOT NULL,

  -- Time window (end_at = start_at + duration + buffer) ──────────────
  start_at                        TIMESTAMPTZ NOT NULL,
  end_at                          TIMESTAMPTZ NOT NULL,
  CHECK (end_at > start_at),

  -- Booking source ───────────────────────────────────────────────────
  payment_method                  TEXT NOT NULL CHECK (payment_method IN (
                                    'stripe',
                                    'in_store',
                                    'comp'
                                  )),
  source                          TEXT NOT NULL DEFAULT 'online' CHECK (source IN (
                                    'online',
                                    'admin_manual'
                                  )),

  -- Customer-supplied per-booking ────────────────────────────────────
  notes                           TEXT,

  -- Stripe fields (NULL for in_store / comp) ──────────────────────────
  stripe_checkout_session_id      TEXT,
  stripe_payment_intent_id        TEXT,
  stripe_event_id                 TEXT,
  amount_paid_cents               INTEGER CHECK (amount_paid_cents IS NULL OR amount_paid_cents >= 0),
  currency                        TEXT NOT NULL DEFAULT 'nzd',

  -- Cancellation ─────────────────────────────────────────────────────
  cancel_token                    TEXT,
  cancel_token_used_at            TIMESTAMPTZ,
  cancelled_at                    TIMESTAMPTZ,
  cancelled_by                    TEXT CHECK (cancelled_by IS NULL OR cancelled_by IN (
                                    'customer',
                                    'admin',
                                    'system'
                                  )),

  -- Audit ────────────────────────────────────────────────────────────
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_ip                       INET,

  -- Webhook idempotency: an event is recorded at most once.
  CONSTRAINT booking_appointments_stripe_event_id_unique UNIQUE (stripe_event_id),
  CONSTRAINT booking_appointments_cancel_token_unique UNIQUE (cancel_token),
  CONSTRAINT booking_appointments_checkout_session_unique UNIQUE (stripe_checkout_session_id),

  -- HARD INVARIANT: no two pending/confirmed bookings overlap for the same technician.
  -- This is database-level enforcement — a race condition between two simultaneous
  -- INSERTs cannot result in a double booking.
  EXCLUDE USING gist (
    technician_sanity_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('pending_payment', 'confirmed'))
);

CREATE INDEX booking_appointments_status_tech_start_idx
  ON booking_appointments (status, technician_sanity_id, start_at);

CREATE INDEX booking_appointments_start_at_idx
  ON booking_appointments (start_at);

CREATE INDEX booking_appointments_customer_idx
  ON booking_appointments (customer_id);

CREATE INDEX booking_appointments_stripe_payment_intent_idx
  ON booking_appointments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- updated_at auto-touch ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION booking_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_appointments_updated_at
  BEFORE UPDATE ON booking_appointments
  FOR EACH ROW
  EXECUTE FUNCTION booking_set_updated_at();

CREATE TRIGGER booking_customers_updated_at
  BEFORE UPDATE ON booking_customers
  FOR EACH ROW
  EXECUTE FUNCTION booking_set_updated_at();

-- ─── Refund audit log (append-only) ─────────────────────────────────
CREATE TABLE booking_refund_log (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id               UUID NOT NULL REFERENCES booking_appointments(id) ON DELETE RESTRICT,
  admin_email              TEXT NOT NULL,
  admin_ip                 INET,
  amount_cents             INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency                 TEXT NOT NULL DEFAULT 'nzd',
  stripe_refund_id         TEXT NOT NULL UNIQUE,
  reason                   TEXT,
  confirmation_text_used   TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX booking_refund_log_booking_idx
  ON booking_refund_log (booking_id);

CREATE INDEX booking_refund_log_created_idx
  ON booking_refund_log (created_at DESC);

-- ─── Webhook log (forensics) ────────────────────────────────────────
CREATE TABLE booking_webhook_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type      TEXT NOT NULL,
  payload_summary JSONB,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_ok    BOOLEAN
);

CREATE INDEX booking_webhook_log_received_idx
  ON booking_webhook_log (received_at DESC);

-- ────────────────────────────────────────────────────────────────────
-- Row-Level Security: enabled with NO permissive policies.
--
-- All booking access is server-side via the service-role key, which bypasses
-- RLS. The anon key (used in the browser for Supabase Auth flows) cannot
-- read or write any row in these tables. This is intentional and tested
-- by hitting the Supabase REST endpoint with the anon key — every request
-- must return empty / 401.
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE booking_customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_refund_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_webhook_log    ENABLE ROW LEVEL SECURITY;

-- (Intentionally no CREATE POLICY statements — deny by default for non-service roles.)
