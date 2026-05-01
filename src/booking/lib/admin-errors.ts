// Friendly error-message mapping for admin actions. Server endpoints return
// machine-readable codes like 'slot_just_taken'; UIs run them through this
// map before display. Unknown codes fall through unchanged.

const FRIENDLY: Record<string, string> = {
  // Common across multiple endpoints
  unauthorized: 'You need to sign in again.',
  invalid_request: 'Some details look invalid — please review and try again.',
  failed: 'Something went wrong. Please try again.',
  network_error: 'Connection problem — please try again.',

  // Booking lifecycle
  booking_not_found: "We couldn't find that booking — it may have been cancelled.",
  not_editable: 'This booking is no longer editable (cancelled or completed).',
  not_reschedulable:
    'Only confirmed bookings can be rescheduled. Pending bookings should be cancelled and rebooked.',
  not_cancellable: 'This booking is no longer cancellable.',
  not_refundable_status: 'Only confirmed bookings can be refunded.',

  // Slots
  slot_unavailable: 'That time slot is no longer available. Please pick another.',
  slot_just_taken:
    'Another booking just claimed that slot. Reload and try a different time or technician.',
  service_unavailable: 'One or more services are no longer available.',

  // Technicians
  tech_not_found: "Couldn't find that technician.",
  tech_not_qualified:
    "That technician doesn't perform every service in this booking.",

  // Refunds / cancel
  confirmation_mismatch:
    'The confirmation text didn\'t match. Please type it exactly as shown.',
  not_stripe_paid: 'This booking was not paid via Stripe — no refund to issue.',
  no_customer: 'This booking has no customer record yet (still pending payment).',
  no_email_on_file: "We don't have an email for this customer.",
  stripe_refund_failed: 'Stripe refused the refund. Check the Stripe dashboard for details.',

  // Resend
  send_failed: "Couldn't send the email. Check Resend dashboard or try again.",
};

export function friendlyError(code: string | undefined): string {
  if (!code) return FRIENDLY.failed;
  return FRIENDLY[code] ?? code;
}
