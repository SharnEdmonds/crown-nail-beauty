'use client';

import { Check } from 'lucide-react';
import { useMemo } from 'react';
import { useCopy } from '@/booking/lib/context';
import { formatDollars } from '@/booking/lib/templating';
import type { BookingService } from '@/booking/lib/types';

interface CategoryGroup {
  slug: string | null;
  title: string;
  services: BookingService[];
}

const UNCATEGORIZED_KEY = '__uncategorized__';
const CATEGORY_LABELS: Record<string, string> = {
  'gel-polish': 'Gel Polish',
  'normal-polish': 'Normal Polish',
  'builder-gel': 'Builder Gel & Extensions',
  'dipping-powder': 'Dipping Powder',
  'eyelash-extension': 'Eyelash Extensions',
  'tinting': 'Tinting',
  'waxing': 'Waxing',
  'facial-care': 'Facials',
  'permanent-makeup': 'Permanent Makeup',
};

export function ServiceStep({
  services,
  selectedIds,
  maxServices,
  onToggle,
  hasQualifiedTech,
}: {
  services: BookingService[];
  selectedIds: string[];
  maxServices: number;
  onToggle: (id: string) => void;
  /** True if at least one technician performs every selected service. When
   *  false (and ≥1 service is selected), the user can still advance — but we
   *  show an inline note so they know the next step will be empty. */
  hasQualifiedTech: boolean;
}) {
  const t = useCopy();

  const groups = useMemo<CategoryGroup[]>(() => {
    const byCategory = new Map<string, CategoryGroup>();
    for (const svc of services) {
      const slug = svc.linkedCategorySlug ?? UNCATEGORIZED_KEY;
      if (!byCategory.has(slug)) {
        byCategory.set(slug, {
          slug: slug === UNCATEGORIZED_KEY ? null : slug,
          title:
            slug === UNCATEGORIZED_KEY
              ? 'Other'
              : CATEGORY_LABELS[slug] ??
                slug
                  .split('-')
                  .map((p) => p[0].toUpperCase() + p.slice(1))
                  .join(' '),
          services: [],
        });
      }
      byCategory.get(slug)!.services.push(svc);
    }
    // Sort within each group by service.order, and groups by their first service's order
    // so the wizard layout matches Sanity's curated ordering.
    const result = Array.from(byCategory.values()).map((g) => ({
      ...g,
      services: g.services.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }));
    result.sort((a, b) => (a.services[0]?.order ?? 0) - (b.services[0]?.order ?? 0));
    return result;
  }, [services]);

  if (services.length === 0) {
    return (
      <div className="booking-card booking-card-pad" style={{ textAlign: 'center' }}>
        <p>{t('serviceEmptyState')}</p>
      </div>
    );
  }

  const selectedSet = new Set(selectedIds);
  const selectedServices = services.filter((s) => selectedSet.has(s._id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDeposit = selectedServices.reduce((sum, s) => sum + s.deposit, 0);

  const reachedMax = selectedIds.length >= maxServices;

  return (
    <section>
      <h2
        className="booking-heading"
        style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '0.5rem' }}
      >
        {t('serviceHeading')}
      </h2>
      <p
        className="booking-helper"
        style={{ textAlign: 'center', marginBottom: '1.5rem' }}
      >
        Pick up to {maxServices} services to bundle into a single appointment.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {groups.map((group) => (
          <div key={group.slug ?? UNCATEGORIZED_KEY}>
            <h3
              className="booking-heading"
              style={{
                fontSize: '0.95rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                color: 'var(--booking-color-text-secondary)',
              }}
            >
              {group.title}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.875rem',
              }}
            >
              {group.services.map((s) => {
                const isSelected = selectedSet.has(s._id);
                const isDisabled = !isSelected && reachedMax;
                return (
                  <ServiceCard
                    key={s._id}
                    service={s}
                    selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && onToggle(s._id)}
                    durationLabel={t('serviceDurationLabel', { minutes: s.durationMinutes })}
                    depositLabel={t('serviceDepositLabel')}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {selectedServices.length > 0 && !hasQualifiedTech ? (
        <div
          className="booking-card booking-card-pad"
          style={{
            marginTop: '1.25rem',
            borderColor: 'var(--booking-color-warning, #C9A962)',
            background: 'rgba(201, 169, 98, 0.08)',
          }}
        >
          <p
            className="booking-helper"
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            No artist performs this combo
          </p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            None of our technicians perform every service in this combination.
            Remove a service to continue, or book each service in a separate appointment.
          </p>
        </div>
      ) : null}
      {selectedServices.length > 0 ? (
        <div
          className="booking-card booking-card-pad"
          style={{ marginTop: '1.25rem' }}
        >
          <p
            className="booking-helper"
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            Combo summary ({selectedServices.length} of {maxServices})
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
            {selectedServices.map((s) => (
              <li
                key={s._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.25rem 0',
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
              borderTop: '1px solid var(--booking-color-border)',
              paddingTop: '0.5rem',
              marginTop: '0.5rem',
              fontSize: '0.95rem',
            }}
          >
            <span>
              <strong>{totalDuration} min</strong> total
            </span>
            <span>
              <strong>{formatDollars(totalPrice)}</strong>{' '}
              <span className="booking-muted">
                · {formatDollars(totalDeposit)} deposit
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ServiceCard({
  service,
  selected,
  disabled,
  onClick,
  durationLabel,
  depositLabel,
}: {
  service: BookingService;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  durationLabel: string;
  depositLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="booking-card"
      style={{
        position: 'relative',
        padding: '1.25rem',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        borderColor: selected ? 'var(--booking-color-accent)' : undefined,
        background: selected ? 'var(--booking-color-accent-muted)' : undefined,
      }}
    >
      <h3
        className="booking-heading"
        style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}
      >
        {service.title}
      </h3>
      <p className="booking-helper" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        {durationLabel}
      </p>
      {service.description ? (
        <p className="booking-muted" style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          {service.description}
        </p>
      ) : null}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
        }}
      >
        <span style={{ fontSize: '1rem', color: 'var(--booking-color-accent)' }}>
          {formatDollars(service.price)}
        </span>
        <span
          className="booking-helper"
          style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          {depositLabel}: {formatDollars(service.deposit)}
        </span>
      </div>
      {selected ? (
        <span
          style={{
            position: 'absolute',
            top: '0.625rem',
            right: '0.625rem',
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: 'var(--booking-radius-full)',
            background: 'var(--booking-color-accent)',
            color: 'var(--booking-color-on-accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={12} />
        </span>
      ) : null}
    </button>
  );
}
