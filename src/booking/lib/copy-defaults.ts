// Hardcoded English fallback for every BookingCopy field.
// Used whenever the Sanity bookingCopy document is missing a field, or the document itself is missing.
// Keys MUST stay in sync with the Sanity schema and the BookingCopy TS interface.

import type { BookingCopy } from './types';

export const COPY_DEFAULTS: Required<Omit<BookingCopy, '_id' | '_type'>> = {
  // Wizard
  wizardPageTitle: 'Reserve Your Experience',
  wizardPageMetaDescription: 'Reserve your appointment online with Atelier Lumière.',
  wizardHeadlineEyebrow: 'Reservations',
  wizardHeadlineMain: 'Reserve Your',
  wizardHeadlineItalic: 'Experience',
  wizardIntro: [],
  wizardWelcomeBackTemplate: 'Welcome back, {firstName} ✓',
  wizardNotYouLink: 'Not {firstName}? Use different details',
  wizardPolicyAcceptText: [],

  // Steps
  stepsServiceLabel: 'Service',
  stepsTechnicianLabel: 'Technician',
  stepsDateTimeLabel: 'Date & Time',
  stepsDetailsLabel: 'Details',
  stepsReviewLabel: 'Review',

  serviceHeading: 'Choose a Service',
  serviceSubHeading: '',
  servicePriceFromLabel: 'from',
  serviceDepositLabel: 'Deposit at booking',
  serviceBalanceLabel: 'Balance due in salon',
  serviceDurationLabel: '{minutes} min',
  serviceEmptyState: 'No services available right now.',

  techHeading: 'Choose Your Technician',
  techSubHeading: 'Each artist below is qualified for {service}.',
  techAnyTechLabel: 'No Preference',
  techAnyTechDescription: "We'll match you with our most-available artist.",
  techSpecialtyLabel: 'Specialty',
  techEmptyState: 'No technicians qualified for this service.',

  dateTimeDateHeading: 'Select Date',
  dateTimeTimeHeading: 'Preferred Time',
  dateTimeMonthFormat: '{month} {year}',
  dateTimeWeekdayShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  dateTimeNoSlotsThisDay: 'No availability — try another day.',
  dateTimeMinHoursBufferNote: 'Same-day bookings need {hours}h notice.',
  dateTimeTimezoneNote: 'All times shown in NZT.',

  detailsHeading: 'Your Details',
  detailsSubHeading: '',
  detailsNameLabel: 'Name',
  detailsNamePlaceholder: 'Full name',
  detailsPhoneLabel: 'Phone',
  detailsPhonePlaceholder: 'e.g. 022 123 4567',
  detailsEmailLabel: 'Email',
  detailsEmailPlaceholder: 'your@email.com',
  detailsNotesLabel: 'Special requests',
  detailsNotesPlaceholder: 'Any allergies, design preferences, or special requests…',
  detailsEmailOptionalSuffix: '(optional)',
  detailsRequiredFieldIndicator: '*',

  reviewHeading: 'Review Your Booking',
  reviewServiceLabel: 'Service',
  reviewTechnicianLabel: 'Technician',
  reviewDateLabel: 'Date',
  reviewTimeLabel: 'Time',
  reviewDepositDueLabel: 'Pay now',
  reviewBalanceDueLabel: 'Pay at appointment',
  reviewPayButtonLabel: 'Pay {amount} deposit & confirm',
  reviewPayingProcessingLabel: 'Redirecting to secure payment…',

  // Errors
  errorsSlotJustTaken: 'That slot was just booked — please pick another.',
  errorsScheduleChanged: "The technician's schedule has changed. Please pick a new time.",
  errorsNetworkError: 'Connection problem — please try again.',
  errorsRateLimited: 'Too many attempts — please wait a moment and try again.',
  errorsCaptchaFailed: "We couldn't verify you're human. Please refresh and try again.",
  errorsGeneric: 'Something went wrong. Please try again or call us.',

  // Nav
  navBack: 'Back',
  navNext: 'Next',
  navCancelWizard: 'Cancel booking',

  // Success
  successHeading: "You're booked",
  successSubheading: "We can't wait to see you, {firstName}.",
  successBodyTemplate: [],
  successCalendarButtonLabel: 'Add to calendar',
  successEmailSentNote: "We've sent a confirmation to {email}.",
  successCancellationNote: [],

  // Cancel
  cancelHeading: 'Cancel your booking',
  cancelConfirmBody: [],
  cancelConfirmButton: 'Yes, cancel and refund {refundAmount}',
  cancelSuccessHeading: 'Cancellation confirmed',
  cancelSuccessBody: [],
  cancelTooLateHeading: 'Inside cancellation window',
  cancelTooLateBody: [],
  cancelAlreadyUsedHeading: 'Already cancelled',
  cancelAlreadyUsedBody: [],

  // Emails
  emailConfirmationSubjectTemplate: 'Your booking is confirmed — {service} on {date}',
  emailConfirmationHeroHeadline: "You're booked",
  emailConfirmationBodyIntro: [],
  emailConfirmationDetailsHeading: 'Appointment details',
  emailConfirmationBalanceNote: 'Balance of {balance} due at appointment.',
  emailConfirmationCancellationHeading: 'Need to cancel?',
  emailConfirmationCancellationBody: [],
  emailConfirmationSignoff: [],
  emailOwnerNotificationSubjectTemplate: 'New booking — {customer} — {date} {time}',
  emailOwnerNotificationHeading: 'New booking received',
  emailOwnerNotificationBody: [],
  emailCancellationSubjectTemplate: 'Your booking has been cancelled',
  emailCancellationHeading: 'Booking cancelled',
  emailCancellationBody: [],
  emailCancellationNoRefundSubjectTemplate: 'Your booking has been cancelled',
  emailCancellationNoRefundHeading: 'Booking cancelled',
  emailCancellationNoRefundBody: [],
  emailRescheduleSubjectTemplate: 'Your booking has been rescheduled — {newDate}',
  emailRescheduleHeading: 'Your booking has been rescheduled',
  emailRescheduleBody: [],
  emailReviewSubjectTemplate: 'How was your visit, {firstName}?',
  emailReviewHeading: 'Thank you for visiting Atelier Lumière',
  emailReviewBody: [],
  reviewLinkUrl: '',
  smsReminderTemplate:
    'Hi {firstName}, reminder of your {service} with {tech} tomorrow at {time}. To cancel/change, please call us. — Atelier Lumière',

  // Admin
  adminDashboardTitle: 'Booking Admin',
  adminBookingsTitle: 'Bookings',
  adminCustomersTitle: 'Customers',
  adminRefundsTitle: 'Refunds',
  adminSignOutLabel: 'Sign out',
  adminRefundConfirmationPrompt:
    "To confirm, type the customer's first name ({customerName}) below.",
  adminRefundButtonTemplate: 'Refund {amount}',
  adminCancelConfirmationPrompt: 'Type CANCEL to confirm cancellation without refund.',
  adminBookingStatusLabels: {
    pending_payment: 'Pending payment',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    expired: 'Expired',
  },
};
