'use client';

import { Check, User } from 'lucide-react';
import { useCopy } from '@/booking/lib/context';
import type { BookingService, Technician } from '@/booking/lib/types';

export function TechnicianStep({
  services,
  technicians,
  value,
  onChange,
}: {
  services: BookingService[];
  technicians: Technician[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const t = useCopy();

  if (technicians.length === 0) {
    return (
      <div className="booking-card booking-card-pad" style={{ textAlign: 'center' }}>
        <p>{t('techEmptyState')}</p>
      </div>
    );
  }

  const serviceLabel =
    services.length === 1
      ? services[0].title
      : services.map((s) => s.title).join(' + ');

  return (
    <section>
      <h2
        className="booking-heading"
        style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '0.5rem' }}
      >
        {t('techHeading')}
      </h2>
      <p className="booking-helper" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {t('techSubHeading', { service: serviceLabel })}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.875rem',
        }}
      >
        <TechCard
          key="any"
          name={t('techAnyTechLabel')}
          specialty={t('techAnyTechDescription')}
          selected={value === 'any'}
          onClick={() => onChange('any')}
        />
        {technicians.map((tech) => (
          <TechCard
            key={tech._id}
            name={tech.name}
            specialty={tech.specialty}
            selected={value === tech._id}
            onClick={() => onChange(tech._id)}
          />
        ))}
      </div>
    </section>
  );
}

function TechCard({
  name,
  specialty,
  selected,
  onClick,
}: {
  name: string;
  specialty?: string;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className="booking-card"
      style={{
        position: 'relative',
        padding: '1.25rem',
        textAlign: 'left',
        cursor: 'pointer',
        borderColor: selected ? 'var(--booking-color-accent)' : undefined,
        background: selected ? 'var(--booking-color-accent-muted)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <span
          aria-hidden
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--booking-radius-full)',
            background: 'var(--booking-color-surface-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--booking-color-text-secondary)',
            fontSize: '0.875rem',
            letterSpacing: '0.05em',
          }}
        >
          {initials || <User size={16} />}
        </span>
        <div>
          <p
            className="booking-heading"
            style={{ fontSize: '1rem', margin: 0 }}
          >
            {name}
          </p>
          {specialty ? (
            <p
              className="booking-muted"
              style={{ fontSize: '0.75rem', margin: '0.15rem 0 0' }}
            >
              {specialty}
            </p>
          ) : null}
        </div>
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
