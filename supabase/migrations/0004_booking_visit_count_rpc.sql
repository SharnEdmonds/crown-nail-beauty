-- Phase 16 audit-fix H3/H4 — atomic visit_count increment.
--
-- Replaces the previous read-modify-write pattern (susceptible to lost updates
-- under concurrent webhooks for the same returning customer) with a single-statement
-- atomic UPDATE that returns the new value to the caller.

CREATE OR REPLACE FUNCTION booking_increment_visit(p_customer_id UUID)
RETURNS INTEGER
LANGUAGE SQL
AS $$
  UPDATE booking_customers
  SET visit_count = visit_count + 1
  WHERE id = p_customer_id
  RETURNING visit_count;
$$;

-- Allow the service-role to call it. Anon role still has no access.
REVOKE ALL ON FUNCTION booking_increment_visit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION booking_increment_visit(UUID) TO service_role;
