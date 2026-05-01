'use client';

import { useCopy, useCopyPortableText } from '@/booking/lib/context';
import { formatDollars } from '@/booking/lib/templating';
import { PortableText } from '@portabletext/react';
import type { BookingService, BookingSettings, Technician } from '@/booking/lib/types';
import type { CustomerDraft } from './DetailsStep';

export function ReviewStep({
  services,
  technician,
  technicianAnyLabel,
  date,
  startUtc,
  customer,
  settings,
  onSubmit,
  submitting,
}: {
  services: BookingService[];
  technician: Technician | null;
  technicianAnyLabel: boolean;
  date: string | null;
  startUtc: string | null;
  customer: CustomerDraft;
  settings: BookingSettings | null;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const t = useCopy();
  const policy = useCopyPortableText()('wizardPolicyAcceptText');
  const tz = settings?.salonTimezone ?? 'UTC';
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDeposit = services.reduce((sum, s) => sum + s.deposit, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const balance = totalPrice - totalDeposit;

  const dateLabel = date
    ? new Intl.DateTimeFormat('en-NZ', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(parseDate(date))
    : '—';

  const timeLabel = startUtc
    ? new Intl.DateTimeFormat('en-NZ', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(startUtc))
    : '—';

  const techLabel = technicianAnyLabel
    ? t('techAnyTechLabel')
    : technician?.name ?? '—';

  return (
    <section className="booking-card booking-card-pad">
      <h2 className="booking-heading" style={{ fontSize: '1.5rem', marginTop: 0 }}>
        {t('reviewHeading')}
      </h2>
      <div style={{ padding: '0.5rem 0' }}>
        <span
          className="booking-helper"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '0.4rem',
          }}
        >
          {t('reviewServiceLabel')}
        </span>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {services.map((s) => (
            <li
              key={s._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                padding: '0.15rem 0',
              }}
            >
              <span>
                {s.title}{' '}
                <span className="booking-muted">({s.durationMinutes} min)</span>
              </span>
              <span>{formatDollars(s.price)}</span>
            </li>
          ))}
        </ul>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            marginTop: '0.4rem',
            color: 'var(--booking-color-text-secondary)',
          }}
        >
          <span>Total {totalDuration} min</span>
          <span>{formatDollars(totalPrice)}</span>
        </div>
      </div>
      <Row label={t('reviewTechnicianLabel')} value={techLabel} />
      <Row label={t('reviewDateLabel')} value={dateLabel} />
      <Row label={t('reviewTimeLabel')} value={timeLabel} />
      <hr
        style={{
          border: 0,
          borderTop: '1px solid var(--booking-color-border)',
          margin: '1rem 0',
        }}
      />
      <Row
        label={t('reviewDepositDueLabel')}
        value={formatDollars(totalDeposit)}
        emphasis
      />
      <Row label={t('reviewBalanceDueLabel')} value={formatDollars(balance)} />

      {policy.length > 0 ? (
        <div
          className="booking-helper"
          style={{
            marginTop: '1.25rem',
            padding: '0.875rem',
            background: 'var(--booking-color-surface-muted)',
            borderRadius: 'var(--booking-radius-md)',
            fontSize: '0.8125rem',
          }}
        >
          <PortableText value={policy} />
        </div>
      ) : null}

      <button
        type="button"
        className="booking-cta"
        onClick={onSubmit}
        disabled={submitting}
        style={{ width: '100%', marginTop: '1.5rem' }}
      >
        {submitting
          ? t('reviewPayingProcessingLabel')
          : t('reviewPayButtonLabel', { amount: formatDollars(totalDeposit) })}
      </button>

      <p
        className="booking-helper"
        style={{ fontSize: '0.7rem', marginTop: '0.5rem', textAlign: 'center' }}
      >
        {customer.email
          ? t('successEmailSentNote', { email: customer.email })
          : null}
      </p>
    </section>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
      }}
    >
      <span
        className="booking-helper"
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: emphasis ? '1rem' : '0.9375rem',
          color: emphasis ? 'var(--booking-color-accent)' : 'var(--booking-color-text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function parseDate(date: string): Date {
  // Date string is "YYYY-MM-DD" — interpret as UTC noon to avoid TZ shifts on weekday display.
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}
