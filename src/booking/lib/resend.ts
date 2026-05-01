// Resend integration. Server-only.
// Sends booking emails composed from bookingTheme + bookingCopy + per-booking variables.

import 'server-only';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import imageUrlBuilder from '@sanity/image-url';
import { client as sanityClient } from '@/sanity/lib/client';
import {
  ConfirmationEmail,
  OwnerNotificationEmail,
  CancellationEmail,
  CancellationNoRefundEmail,
  RescheduleNotificationEmail,
  ReviewRequestEmail,
} from './email/templates';
import { buildIcs } from './ics';
import { COPY_DEFAULTS } from './copy-defaults';
import { renderTemplate, type TemplateVars } from './templating';
import type { BookingCopy, BookingSettings, BookingTheme, SanityImageRef } from './types';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Atelier Lumière <onboarding@resend.dev>';

let cached: Resend | null = null;
function getResend(): Resend {
  if (cached) return cached;
  if (!RESEND_API_KEY) throw new Error('[booking] RESEND_API_KEY is not set.');
  cached = new Resend(RESEND_API_KEY);
  return cached;
}

const builder = imageUrlBuilder(sanityClient);
function imageUrl(image: SanityImageRef | undefined): string | undefined {
  if (!image?.asset) return undefined;
  try {
    return builder.image(image).width(600).fit('max').url();
  } catch {
    return undefined;
  }
}

// ─── Customer confirmation + .ics ──────────────────────────────────
export interface ConfirmationInput {
  to: string;
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  settings: BookingSettings;
  vars: TemplateVars;             // Includes service, tech, date, time, balance, cancelLink, etc.
  bookingId: string;
  startUtc: string;
  endUtc: string;
  serviceName: string;
  technicianName: string;
  salonAddress?: string;
}

export async function sendConfirmationEmail(input: ConfirmationInput) {
  const subject = renderTemplate(
    (input.copy?.emailConfirmationSubjectTemplate as string | undefined) ??
      COPY_DEFAULTS.emailConfirmationSubjectTemplate,
    input.vars,
    'emailConfirmationSubjectTemplate',
  );

  const logoUrl = imageUrl(input.theme?.logoEmailHeader);

  const html = await render(
    ConfirmationEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
  );
  const text = await render(
    ConfirmationEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
    { plainText: true },
  );

  const ics = buildIcs({
    uid: input.bookingId,
    startUtc: input.startUtc,
    endUtc: input.endUtc,
    summary: `${input.serviceName} — Atelier Lumière`,
    description: `With ${input.technicianName}.`,
    location: input.salonAddress,
    organizerName: 'Atelier Lumière',
    organizerEmail: RESEND_FROM_EMAIL.replace(/.*<|>.*/g, ''),
    attendeeEmail: input.to,
    timezone: input.settings.salonTimezone,
  });

  return getResend().emails.send({
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'appointment.ics',
        content: Buffer.from(ics).toString('base64'),
      },
    ],
  });
}

// ─── Owner notification ──────────────────────────────────────────────
export interface OwnerNotifyInput {
  to: string[];
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  vars: TemplateVars;
}

export async function sendOwnerNotification(input: OwnerNotifyInput) {
  if (input.to.length === 0) return;

  const subject = renderTemplate(
    (input.copy?.emailOwnerNotificationSubjectTemplate as string | undefined) ??
      COPY_DEFAULTS.emailOwnerNotificationSubjectTemplate,
    input.vars,
    'emailOwnerNotificationSubjectTemplate',
  );

  const logoUrl = imageUrl(input.theme?.logoEmailHeader);

  const html = await render(
    OwnerNotificationEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
  );
  const text = await render(
    OwnerNotificationEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
    { plainText: true },
  );

  return getResend().emails.send({
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    html,
    text,
  });
}

// ─── Cancellation emails ────────────────────────────────────────────
export interface CancellationInput {
  to: string;
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  vars: TemplateVars;
  withRefund: boolean;
}

// ─── Post-appointment review request ────────────────────────────────
export interface ReviewRequestInput {
  to: string;
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  vars: TemplateVars;
}

export async function sendReviewRequestEmail(input: ReviewRequestInput) {
  const subject = renderTemplate(
    (input.copy?.emailReviewSubjectTemplate as string | undefined) ??
      COPY_DEFAULTS.emailReviewSubjectTemplate,
    input.vars,
    'emailReviewSubjectTemplate',
  );

  const logoUrl = imageUrl(input.theme?.logoEmailHeader);

  const html = await render(
    ReviewRequestEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
  );
  const text = await render(
    ReviewRequestEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
    { plainText: true },
  );

  return getResend().emails.send({
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    html,
    text,
  });
}

// ─── Reschedule notification ────────────────────────────────────────
export interface RescheduleInput {
  to: string;
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  vars: TemplateVars;
}

export async function sendRescheduleNotification(input: RescheduleInput) {
  const subject = renderTemplate(
    (input.copy?.emailRescheduleSubjectTemplate as string | undefined) ??
      COPY_DEFAULTS.emailRescheduleSubjectTemplate,
    input.vars,
    'emailRescheduleSubjectTemplate',
  );

  const logoUrl = imageUrl(input.theme?.logoEmailHeader);

  const html = await render(
    RescheduleNotificationEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
  );
  const text = await render(
    RescheduleNotificationEmail({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
    { plainText: true },
  );

  return getResend().emails.send({
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    html,
    text,
  });
}

export async function sendCancellationEmail(input: CancellationInput) {
  const Tpl = input.withRefund ? CancellationEmail : CancellationNoRefundEmail;
  const subjectKey = input.withRefund
    ? 'emailCancellationSubjectTemplate'
    : 'emailCancellationNoRefundSubjectTemplate';
  const subject = renderTemplate(
    (input.copy?.[subjectKey] as string | undefined) ?? COPY_DEFAULTS[subjectKey],
    input.vars,
    subjectKey,
  );

  const logoUrl = imageUrl(input.theme?.logoEmailHeader);

  const html = await render(
    Tpl({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
  );
  const text = await render(
    Tpl({
      copy: input.copy,
      theme: input.theme,
      vars: input.vars,
      logoUrl,
      preheader: subject,
    }),
    { plainText: true },
  );

  return getResend().emails.send({
    from: RESEND_FROM_EMAIL,
    to: input.to,
    subject,
    html,
    text,
  });
}
