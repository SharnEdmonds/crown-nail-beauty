// React Email templates for booking transactional mails.
// Each template consumes bookingTheme + bookingCopy and substitutes per-booking variables.

import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { BookingCopy, BookingTheme } from '../types';
import { resolveThemeVars } from '../theme-css';
import { COPY_DEFAULTS } from '../copy-defaults';
import { renderTemplate, type TemplateVars } from '../templating';
import { PortableTextEmail } from './portable-text-email';

interface BaseProps {
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  vars: TemplateVars;
  logoUrl?: string;          // already-resolved Sanity image URL for the email header
  preheader?: string;
}

function copyString<K extends keyof typeof COPY_DEFAULTS>(
  copy: BookingCopy | null,
  key: K,
  vars?: TemplateVars,
): string {
  const fromCms = (copy as Record<string, unknown> | null)?.[key as string];
  const fromDefault = COPY_DEFAULTS[key];
  const source = typeof fromCms === 'string' && fromCms.length > 0 ? fromCms : fromDefault;
  return typeof source === 'string' ? renderTemplate(source, vars, key as string) : '';
}

function copyPt<K extends keyof typeof COPY_DEFAULTS>(
  copy: BookingCopy | null,
  key: K,
) {
  const fromCms = (copy as Record<string, unknown> | null)?.[key as string];
  const fromDefault = COPY_DEFAULTS[key];
  if (Array.isArray(fromCms) && fromCms.length > 0) return fromCms;
  if (Array.isArray(fromDefault)) return fromDefault;
  return [];
}

function Layout({
  children,
  theme,
  preheader,
  logoUrl,
  copy,
}: BaseProps & { children: React.ReactNode }) {
  const vars = resolveThemeVars(theme);
  const bg = vars['--booking-email-bg'];
  const card = vars['--booking-email-card'];
  const textPrimary = vars['--booking-color-text-primary'];
  const headingFont = vars['--booking-heading-font'];
  const bodyFont = vars['--booking-body-font'];

  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <Preview>{preheader ?? ''}</Preview>
      <Body
        style={{
          backgroundColor: bg,
          fontFamily: bodyFont,
          margin: 0,
          padding: '24px 0',
        }}
      >
        <Container
          style={{
            backgroundColor: card,
            maxWidth: '600px',
            margin: '0 auto',
            padding: '32px 24px',
          }}
        >
          {logoUrl ? (
            <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Img src={logoUrl} alt="" width="180" style={{ display: 'inline-block' }} />
            </Section>
          ) : null}
          {children}
          <Hr
            style={{
              borderColor: vars['--booking-color-border'],
              borderStyle: 'solid',
              borderWidth: '0 0 1px',
              marginTop: '32px',
              marginBottom: '16px',
            }}
          />
          <Section>
            <PortableTextEmail
              value={copyPt(copy, 'emailConfirmationSignoff')}
              textColor={vars['--booking-color-text-secondary']}
              linkColor={vars['--booking-color-accent']}
              fontFamily={headingFont}
            />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Customer confirmation ────────────────────────────────────────────
export function ConfirmationEmail(props: BaseProps) {
  const { copy, theme, vars } = props;
  const t = resolveThemeVars(theme);
  return (
    <Layout {...props} preheader={copyString(copy, 'emailConfirmationHeroHeadline', vars)}>
      <Text
        style={{
          fontSize: '28px',
          fontFamily: t['--booking-heading-font'],
          color: t['--booking-color-text-primary'],
          margin: '0 0 16px',
        }}
      >
        {copyString(copy, 'emailConfirmationHeroHeadline', vars)}
      </Text>
      <PortableTextEmail
        value={copyPt(copy, 'emailConfirmationBodyIntro')}
        vars={vars}
        textColor={t['--booking-color-text-primary']}
        linkColor={t['--booking-color-accent']}
        fontFamily={t['--booking-body-font']}
      />
      <Section style={{ marginTop: '24px' }}>
        <Text
          style={{
            fontSize: '12px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: t['--booking-color-text-secondary'],
            margin: '0 0 8px',
          }}
        >
          {copyString(copy, 'emailConfirmationDetailsHeading', vars)}
        </Text>
        <Detail label="Service" value={String(vars.service ?? '')} t={t} />
        <Detail label="Technician" value={String(vars.tech ?? '')} t={t} />
        <Detail label="Date" value={String(vars.date ?? '')} t={t} />
        <Detail label="Time" value={String(vars.time ?? '')} t={t} />
        {vars.address ? <Detail label="Where" value={String(vars.address)} t={t} /> : null}
        {vars.balance ? (
          <Text
            style={{
              fontSize: '14px',
              color: t['--booking-color-text-secondary'],
              marginTop: '12px',
            }}
          >
            {copyString(copy, 'emailConfirmationBalanceNote', vars)}
          </Text>
        ) : null}
      </Section>
      <Section style={{ marginTop: '28px' }}>
        <Text
          style={{
            fontSize: '12px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: t['--booking-color-text-secondary'],
            margin: '0 0 8px',
          }}
        >
          {copyString(copy, 'emailConfirmationCancellationHeading', vars)}
        </Text>
        <PortableTextEmail
          value={copyPt(copy, 'emailConfirmationCancellationBody')}
          vars={vars}
          textColor={t['--booking-color-text-secondary']}
          linkColor={t['--booking-color-accent']}
          fontFamily={t['--booking-body-font']}
        />
      </Section>
    </Layout>
  );
}

// ── Owner notification ───────────────────────────────────────────────
export function OwnerNotificationEmail(props: BaseProps) {
  const { copy, theme, vars } = props;
  const t = resolveThemeVars(theme);
  return (
    <Layout {...props} preheader={copyString(copy, 'emailOwnerNotificationHeading', vars)}>
      <Text
        style={{
          fontSize: '22px',
          fontFamily: t['--booking-heading-font'],
          color: t['--booking-color-text-primary'],
          margin: '0 0 16px',
        }}
      >
        {copyString(copy, 'emailOwnerNotificationHeading', vars)}
      </Text>
      <PortableTextEmail
        value={copyPt(copy, 'emailOwnerNotificationBody')}
        vars={vars}
        textColor={t['--booking-color-text-primary']}
        linkColor={t['--booking-color-accent']}
        fontFamily={t['--booking-body-font']}
      />
    </Layout>
  );
}

// ── Cancellation (with refund) ───────────────────────────────────────
export function CancellationEmail(props: BaseProps) {
  const { copy, theme, vars } = props;
  const t = resolveThemeVars(theme);
  return (
    <Layout {...props} preheader={copyString(copy, 'emailCancellationHeading', vars)}>
      <Text
        style={{
          fontSize: '22px',
          fontFamily: t['--booking-heading-font'],
          color: t['--booking-color-text-primary'],
          margin: '0 0 16px',
        }}
      >
        {copyString(copy, 'emailCancellationHeading', vars)}
      </Text>
      <PortableTextEmail
        value={copyPt(copy, 'emailCancellationBody')}
        vars={vars}
        textColor={t['--booking-color-text-primary']}
        linkColor={t['--booking-color-accent']}
        fontFamily={t['--booking-body-font']}
      />
    </Layout>
  );
}

// ── Post-appointment review request ───────────────────────────────────
export function ReviewRequestEmail(props: BaseProps) {
  const { copy, theme, vars } = props;
  const t = resolveThemeVars(theme);
  return (
    <Layout {...props} preheader={copyString(copy, 'emailReviewHeading', vars)}>
      <Text
        style={{
          fontSize: '22px',
          fontFamily: t['--booking-heading-font'],
          color: t['--booking-color-text-primary'],
          margin: '0 0 16px',
        }}
      >
        {copyString(copy, 'emailReviewHeading', vars)}
      </Text>
      <PortableTextEmail
        value={copyPt(copy, 'emailReviewBody')}
        vars={vars}
        textColor={t['--booking-color-text-primary']}
        linkColor={t['--booking-color-accent']}
        fontFamily={t['--booking-body-font']}
      />
    </Layout>
  );
}

// ── Reschedule notification ──────────────────────────────────────────
export function RescheduleNotificationEmail(props: BaseProps) {
  const { copy, theme, vars } = props;
  const t = resolveThemeVars(theme);
  return (
    <Layout {...props} preheader={copyString(copy, 'emailRescheduleHeading', vars)}>
      <Text
        style={{
          fontSize: '22px',
          fontFamily: t['--booking-heading-font'],
          color: t['--booking-color-text-primary'],
          margin: '0 0 16px',
        }}
      >
        {copyString(copy, 'emailRescheduleHeading', vars)}
      </Text>
      <PortableTextEmail
        value={copyPt(copy, 'emailRescheduleBody')}
        vars={vars}
        textColor={t['--booking-color-text-primary']}
        linkColor={t['--booking-color-accent']}
        fontFamily={t['--booking-body-font']}
      />
    </Layout>
  );
}

// ── Cancellation (no refund — deposit retained) ─────────────────────
export function CancellationNoRefundEmail(props: BaseProps) {
  const { copy, theme, vars } = props;
  const t = resolveThemeVars(theme);
  return (
    <Layout {...props} preheader={copyString(copy, 'emailCancellationNoRefundHeading', vars)}>
      <Text
        style={{
          fontSize: '22px',
          fontFamily: t['--booking-heading-font'],
          color: t['--booking-color-text-primary'],
          margin: '0 0 16px',
        }}
      >
        {copyString(copy, 'emailCancellationNoRefundHeading', vars)}
      </Text>
      <PortableTextEmail
        value={copyPt(copy, 'emailCancellationNoRefundBody')}
        vars={vars}
        textColor={t['--booking-color-text-primary']}
        linkColor={t['--booking-color-accent']}
        fontFamily={t['--booking-body-font']}
      />
    </Layout>
  );
}

function Detail({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: Record<string, string>;
}) {
  return (
    <Section
      style={{
        borderBottom: `1px solid ${t['--booking-color-border']}`,
        padding: '8px 0',
      }}
    >
      <Text
        style={{
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: t['--booking-color-text-muted'],
          margin: '0 0 2px',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: '14px',
          color: t['--booking-color-text-primary'],
          margin: 0,
        }}
      >
        {value}
      </Text>
    </Section>
  );
}
