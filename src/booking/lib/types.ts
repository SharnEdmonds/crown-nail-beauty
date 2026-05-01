// Booking-module-only TS types. Mirrors the Sanity schemas + Supabase tables.
// The marketing site MUST NOT import from this file.

import type { PortableTextBlock } from '@sanity/types';

// ──────────────────────────────────────────────────────────
// Sanity content types
// ──────────────────────────────────────────────────────────

export interface SanityImageRef {
  asset?: { _ref: string; _type: 'reference' };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

export interface BookingService {
  _id: string;
  _type: 'bookingService';
  title: string;
  slug: { current: string };
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  /** Full price in NZD (dollars). Stored as cents internally — use dollarsToCents(). */
  price: number;
  /** Deposit in NZD (dollars). Stored as cents internally — use dollarsToCents(). */
  deposit: number;
  linkedCategorySlug?: string;
  order: number;
  isActive: boolean;
  imageOptional?: SanityImageRef;
}

export interface TechnicianDaySchedule {
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  isWorkingDay: boolean;
  startTime?: string; // "HH:mm"
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface TechnicianTimeOff {
  startDate: string; // ISO date "YYYY-MM-DD"
  endDate: string;
  reason?: string;
}

export interface Technician {
  _id: string;
  _type: 'technician';
  name: string;
  slug: { current: string };
  photo?: SanityImageRef;
  bio?: string;
  specialty?: string;
  services?: Array<{ _ref: string }>;
  weeklySchedule: TechnicianDaySchedule[];
  timeOff?: TechnicianTimeOff[];
  isActive: boolean;
  order: number;
}

export interface BookingSettings {
  _id: string;
  _type: 'bookingSettings';
  isBookingEnabled: boolean;
  salonTimezone: string;
  slotIntervalMinutes: number;
  minHoursAheadToBook: number;
  maxDaysAheadToBook: number;
  cancellationCutoffHours: number;
  pendingPaymentTtlMinutes: number;
  publicHolidayDates?: Array<{ date: string; label?: string }>;
  cancellationPolicyText?: PortableTextBlock[];
  privacyPolicyText?: PortableTextBlock[];
  ownerNotificationEmails?: string[];
  contactPhoneOverride?: string;
  smsRemindersEnabled?: boolean;
}

export interface BookingTheme {
  _id: string;
  _type: 'bookingTheme';
  logoPrimary?: SanityImageRef;
  logoSubmark?: SanityImageRef;
  logoEmailHeader?: SanityImageRef;
  // Core 14
  colorBackground: string;
  colorSurface: string;
  colorSurfaceMuted: string;
  colorBorder: string;
  colorBorderFocus: string;
  colorTextPrimary: string;
  colorTextSecondary: string;
  colorTextMuted: string;
  colorAccent: string;
  colorAccentMuted: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorOnAccent: string;
  // Optional overrides
  colorStepActive?: string;
  colorStepCompleted?: string;
  colorStepPending?: string;
  colorSlotAvailable?: string;
  colorSlotSelected?: string;
  colorSlotUnavailable?: string;
  // Typography & radius
  headingFontFamily: string;
  bodyFontFamily: string;
  monoFontFamily: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;
  // Email
  emailBackgroundColor: string;
  emailCardColor: string;
  emailFooterText?: PortableTextBlock[];
}

// ──────────────────────────────────────────────────────────
// Booking copy — flat shape with prefixed keys for ergonomic access
// Group prefixes match the schema: wizard*, steps*, service*, tech*, dateTime*,
// details*, review*, errors*, nav*, success*, cancel*, emailConfirmation*,
// emailOwnerNotification*, emailCancellation*, emailCancellationNoRefund*, admin*.
// ──────────────────────────────────────────────────────────

export interface BookingCopy {
  _id: string;
  _type: 'bookingCopy';

  // Wizard
  wizardPageTitle?: string;
  wizardPageMetaDescription?: string;
  wizardHeadlineEyebrow?: string;
  wizardHeadlineMain?: string;
  wizardHeadlineItalic?: string;
  wizardIntro?: PortableTextBlock[];
  wizardWelcomeBackTemplate?: string;
  wizardNotYouLink?: string;
  wizardPolicyAcceptText?: PortableTextBlock[];

  // Steps & step content
  stepsServiceLabel?: string;
  stepsTechnicianLabel?: string;
  stepsDateTimeLabel?: string;
  stepsDetailsLabel?: string;
  stepsReviewLabel?: string;

  serviceHeading?: string;
  serviceSubHeading?: string;
  servicePriceFromLabel?: string;
  serviceDepositLabel?: string;
  serviceBalanceLabel?: string;
  serviceDurationLabel?: string;
  serviceEmptyState?: string;

  techHeading?: string;
  techSubHeading?: string;
  techAnyTechLabel?: string;
  techAnyTechDescription?: string;
  techSpecialtyLabel?: string;
  techEmptyState?: string;

  dateTimeDateHeading?: string;
  dateTimeTimeHeading?: string;
  dateTimeMonthFormat?: string;
  dateTimeWeekdayShort?: string[];
  dateTimeNoSlotsThisDay?: string;
  dateTimeMinHoursBufferNote?: string;
  dateTimeTimezoneNote?: string;

  detailsHeading?: string;
  detailsSubHeading?: string;
  detailsNameLabel?: string;
  detailsNamePlaceholder?: string;
  detailsPhoneLabel?: string;
  detailsPhonePlaceholder?: string;
  detailsEmailLabel?: string;
  detailsEmailPlaceholder?: string;
  detailsNotesLabel?: string;
  detailsNotesPlaceholder?: string;
  detailsEmailOptionalSuffix?: string;
  detailsRequiredFieldIndicator?: string;

  reviewHeading?: string;
  reviewServiceLabel?: string;
  reviewTechnicianLabel?: string;
  reviewDateLabel?: string;
  reviewTimeLabel?: string;
  reviewDepositDueLabel?: string;
  reviewBalanceDueLabel?: string;
  reviewPayButtonLabel?: string;
  reviewPayingProcessingLabel?: string;

  // Errors
  errorsSlotJustTaken?: string;
  errorsScheduleChanged?: string;
  errorsNetworkError?: string;
  errorsRateLimited?: string;
  errorsCaptchaFailed?: string;
  errorsGeneric?: string;

  // Nav
  navBack?: string;
  navNext?: string;
  navCancelWizard?: string;

  // Success
  successHeading?: string;
  successSubheading?: string;
  successBodyTemplate?: PortableTextBlock[];
  successCalendarButtonLabel?: string;
  successEmailSentNote?: string;
  successCancellationNote?: PortableTextBlock[];

  // Cancel
  cancelHeading?: string;
  cancelConfirmBody?: PortableTextBlock[];
  cancelConfirmButton?: string;
  cancelSuccessHeading?: string;
  cancelSuccessBody?: PortableTextBlock[];
  cancelTooLateHeading?: string;
  cancelTooLateBody?: PortableTextBlock[];
  cancelAlreadyUsedHeading?: string;
  cancelAlreadyUsedBody?: PortableTextBlock[];

  // Emails
  emailConfirmationSubjectTemplate?: string;
  emailConfirmationHeroHeadline?: string;
  emailConfirmationBodyIntro?: PortableTextBlock[];
  emailConfirmationDetailsHeading?: string;
  emailConfirmationBalanceNote?: string;
  emailConfirmationCancellationHeading?: string;
  emailConfirmationCancellationBody?: PortableTextBlock[];
  emailConfirmationSignoff?: PortableTextBlock[];
  emailOwnerNotificationSubjectTemplate?: string;
  emailOwnerNotificationHeading?: string;
  emailOwnerNotificationBody?: PortableTextBlock[];
  emailCancellationSubjectTemplate?: string;
  emailCancellationHeading?: string;
  emailCancellationBody?: PortableTextBlock[];
  emailCancellationNoRefundSubjectTemplate?: string;
  emailCancellationNoRefundHeading?: string;
  emailCancellationNoRefundBody?: PortableTextBlock[];
  emailRescheduleSubjectTemplate?: string;
  emailRescheduleHeading?: string;
  emailRescheduleBody?: PortableTextBlock[];
  emailReviewSubjectTemplate?: string;
  emailReviewHeading?: string;
  emailReviewBody?: PortableTextBlock[];
  reviewLinkUrl?: string;
  smsReminderTemplate?: string;

  // Admin
  adminDashboardTitle?: string;
  adminBookingsTitle?: string;
  adminCustomersTitle?: string;
  adminRefundsTitle?: string;
  adminSignOutLabel?: string;
  adminRefundConfirmationPrompt?: string;
  adminRefundButtonTemplate?: string;
  adminCancelConfirmationPrompt?: string;
  adminBookingStatusLabels?: {
    pending_payment?: string;
    confirmed?: string;
    cancelled?: string;
    completed?: string;
    expired?: string;
  };
}

// All keys of BookingCopy, used as the type for the useCopy() lookup.
export type BookingCopyKey = keyof BookingCopy;

// ──────────────────────────────────────────────────────────
// Supabase row types
// ──────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'expired';

export type PaymentMethod = 'stripe' | 'in_store' | 'comp';
export type BookingSource = 'online' | 'admin_manual';

export interface BookingCustomerRow {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  visit_count: number;
  first_seen_at: string;
  last_seen_at: string;
  is_redacted: boolean;
}

export interface BookingAppointmentRow {
  id: string;
  customer_id: string | null;
  status: BookingStatus;
  service_sanity_id: string;
  /** Empty array for single-service bookings; populated for multi-service combos. */
  additional_service_sanity_ids: string[];
  service_name_snapshot: string;
  service_price_cents_snapshot: number;
  service_duration_min_snapshot: number;
  buffer_min_snapshot: number;
  deposit_cents_snapshot: number;
  technician_sanity_id: string;
  technician_name_snapshot: string;
  start_at: string;
  end_at: string;
  payment_method: PaymentMethod;
  source: BookingSource;
  notes: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_event_id: string | null;
  amount_paid_cents: number | null;
  currency: string;
  cancel_token: string | null;
  cancel_token_used_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
  client_ip: string | null;
}

export interface BookingRefundLogRow {
  id: string;
  booking_id: string;
  admin_email: string;
  admin_ip: string | null;
  amount_cents: number;
  currency: string;
  stripe_refund_id: string;
  reason: string | null;
  confirmation_text_used: string | null;
  created_at: string;
}
