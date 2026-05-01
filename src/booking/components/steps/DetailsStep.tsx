'use client';

import { useCopy } from '@/booking/lib/context';

export interface CustomerDraft {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export function DetailsStep({
  customer,
  onChange,
}: {
  customer: CustomerDraft;
  onChange: (next: CustomerDraft) => void;
}) {
  const t = useCopy();

  function update<K extends keyof CustomerDraft>(key: K, value: string) {
    onChange({ ...customer, [key]: value });
  }

  return (
    <section className="booking-card booking-card-pad">
      <h2 className="booking-heading" style={{ fontSize: '1.5rem', marginTop: 0 }}>
        {t('detailsHeading')}
      </h2>
      {t('detailsSubHeading') ? (
        <p className="booking-helper" style={{ marginBottom: '1rem' }}>
          {t('detailsSubHeading')}
        </p>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label className="booking-label">
            {t('detailsNameLabel')}{' '}
            <span style={{ color: 'var(--booking-color-error)' }}>
              {t('detailsRequiredFieldIndicator')}
            </span>
          </label>
          <input
            className="booking-input"
            type="text"
            value={customer.name}
            placeholder={t('detailsNamePlaceholder')}
            onChange={(e) => update('name', e.target.value)}
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className="booking-label">
            {t('detailsPhoneLabel')}{' '}
            <span style={{ color: 'var(--booking-color-error)' }}>
              {t('detailsRequiredFieldIndicator')}
            </span>
          </label>
          <input
            className="booking-input"
            type="tel"
            value={customer.phone}
            placeholder={t('detailsPhonePlaceholder')}
            onChange={(e) => update('phone', e.target.value)}
            maxLength={20}
            required
          />
        </div>
        <div>
          <label className="booking-label">
            {t('detailsEmailLabel')}{' '}
            <span style={{ color: 'var(--booking-color-error)' }}>
              {t('detailsRequiredFieldIndicator')}
            </span>
          </label>
          <input
            className="booking-input"
            type="email"
            value={customer.email}
            placeholder={t('detailsEmailPlaceholder')}
            onChange={(e) => update('email', e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <div>
          <label className="booking-label">
            {t('detailsNotesLabel')}{' '}
            <span className="booking-muted">{t('detailsEmailOptionalSuffix')}</span>
          </label>
          <textarea
            className="booking-textarea"
            value={customer.notes}
            placeholder={t('detailsNotesPlaceholder')}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            maxLength={2000}
          />
        </div>
      </div>
    </section>
  );
}
