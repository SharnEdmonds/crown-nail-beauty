'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCopy } from '@/booking/lib/context';
import { safeJson } from '@/booking/lib/templating';
import type {
  BookingService,
  BookingSettings,
  Technician,
} from '@/booking/lib/types';
import type { RecognizedCustomer } from './BookingPageClient';
import { ServiceStep } from './steps/ServiceStep';
import { TechnicianStep } from './steps/TechnicianStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { DetailsStep } from './steps/DetailsStep';
import { ReviewStep } from './steps/ReviewStep';
import { WelcomeBackBadge } from './WelcomeBackBadge';

const STEP_KEYS = [
  'stepsServiceLabel',
  'stepsTechnicianLabel',
  'stepsDateTimeLabel',
  'stepsDetailsLabel',
  'stepsReviewLabel',
] as const;

const MAX_SERVICES = 3;

export interface WizardState {
  /** 1-3 selected service ids, in selection order. */
  serviceIds: string[];
  technicianId: string | null; // 'any' or a specific id
  date: string | null; // YYYY-MM-DD
  startUtc: string | null; // ISO
  endUtc: string | null;
  customer: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
}

const INITIAL_STATE: WizardState = {
  serviceIds: [],
  technicianId: null,
  date: null,
  startUtc: null,
  endUtc: null,
  customer: { name: '', phone: '', email: '', notes: '' },
};

export function BookingWizard({
  settings,
  services,
  technicians,
  recognizedCustomer,
}: {
  settings: BookingSettings | null;
  services: BookingService[];
  technicians: Technician[];
  recognizedCustomer: RecognizedCustomer | null;
}) {
  const t = useCopy();

  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(() =>
    recognizedCustomer
      ? {
          ...INITIAL_STATE,
          customer: {
            name: recognizedCustomer.name,
            phone: recognizedCustomer.phone,
            email: recognizedCustomer.email ?? '',
            notes: '',
          },
        }
      : INITIAL_STATE,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServices = useMemo(
    () =>
      state.serviceIds
        .map((id) => services.find((s) => s._id === id))
        .filter((s): s is BookingService => Boolean(s)),
    [services, state.serviceIds],
  );

  // A tech is qualified iff they perform EVERY selected service.
  const qualifiedTechs = useMemo(() => {
    if (state.serviceIds.length === 0) return [];
    return technicians.filter(
      (tech) =>
        tech.isActive &&
        state.serviceIds.every((sid) =>
          (tech.services as unknown as string[] | undefined)?.includes(sid),
        ),
    );
  }, [technicians, state.serviceIds]);

  const selectedTech = useMemo(() => {
    if (state.technicianId === null || state.technicianId === 'any') return null;
    return qualifiedTechs.find((tt) => tt._id === state.technicianId) ?? null;
  }, [qualifiedTechs, state.technicianId]);

  function toggleService(serviceId: string) {
    setState((s) => {
      const next = s.serviceIds.includes(serviceId)
        ? s.serviceIds.filter((id) => id !== serviceId)
        : s.serviceIds.length < MAX_SERVICES
          ? [...s.serviceIds, serviceId]
          : s.serviceIds;
      // If service set changed, reset downstream state because qualified techs / slots
      // depend on the full combo.
      if (next === s.serviceIds) return s;
      return {
        ...s,
        serviceIds: next,
        technicianId: null,
        startUtc: null,
        endUtc: null,
      };
    });
  }

  function canProceed(currentStep: number): boolean {
    switch (currentStep) {
      case 1:
        // Only require at least one service selected. If the combo has no
        // qualified technician, the TechnicianStep shows that explicitly via
        // its empty state — gating Next here just disables the button silently
        // and leaves the user wondering why.
        return state.serviceIds.length >= 1;
      case 2:
        return !!state.technicianId;
      case 3:
        return !!state.startUtc;
      case 4:
        return (
          state.customer.name.trim().length > 0 &&
          state.customer.phone.trim().length >= 6 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customer.email.trim())
        );
      case 5:
        return true;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (
      state.serviceIds.length === 0 ||
      !state.technicianId ||
      !state.startUtc ||
      !state.date
    )
      return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serviceIds: state.serviceIds,
          technicianId: state.technicianId,
          date: state.date,
          startUtc: state.startUtc,
          customer: state.customer,
        }),
      });
      const data = await safeJson<{ error?: string; checkoutUrl?: string; bookingId?: string }>(res);
      if (!res.ok) {
        setError(mapErrorCode(data?.error, t));
        if (data?.error === 'slot_just_taken' || data?.error === 'slot_unavailable') {
          setStep(3);
          setState((s) => ({ ...s, startUtc: null, endUtc: null }));
        }
        setSubmitting(false);
        return;
      }
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(t('errorsGeneric'));
        setSubmitting(false);
      }
    } catch (err) {
      console.error('[booking] submit failed', err);
      setError(t('errorsNetworkError'));
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (canProceed(step) && step < 5) setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div className="booking-page">
      <div className="booking-shell">
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p className="booking-eyebrow">{t('wizardHeadlineEyebrow')}</p>
          {recognizedCustomer ? (
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <WelcomeBackBadge firstName={firstName(recognizedCustomer.name)} />
            </div>
          ) : null}
          <h1
            className="booking-heading"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginTop: '0.75rem' }}
          >
            {t('wizardHeadlineMain')}{' '}
            <em style={{ fontStyle: 'italic' }}>{t('wizardHeadlineItalic')}</em>
          </h1>
        </header>

        <StepIndicator step={step} />

        {error ? (
          <div className="booking-error-banner" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <ServiceStep
                services={services}
                selectedIds={state.serviceIds}
                maxServices={MAX_SERVICES}
                onToggle={toggleService}
                hasQualifiedTech={qualifiedTechs.length > 0}
              />
            )}
            {step === 2 && selectedServices.length > 0 && (
              <TechnicianStep
                services={selectedServices}
                technicians={qualifiedTechs}
                value={state.technicianId}
                onChange={(technicianId) =>
                  setState((s) => ({
                    ...s,
                    technicianId,
                    startUtc: null,
                    endUtc: null,
                  }))
                }
              />
            )}
            {step === 3 && selectedServices.length > 0 && state.technicianId && (
              <DateTimeStep
                serviceIds={state.serviceIds}
                technicianId={state.technicianId}
                settings={settings}
                date={state.date}
                startUtc={state.startUtc}
                onChange={(date, startUtc, endUtc) =>
                  setState((s) => ({ ...s, date, startUtc, endUtc }))
                }
              />
            )}
            {step === 4 && (
              <DetailsStep
                customer={state.customer}
                onChange={(customer) => setState((s) => ({ ...s, customer }))}
              />
            )}
            {step === 5 && selectedServices.length > 0 && (
              <ReviewStep
                services={selectedServices}
                technician={selectedTech}
                technicianAnyLabel={state.technicianId === 'any'}
                date={state.date}
                startUtc={state.startUtc}
                customer={state.customer}
                settings={settings}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <Nav
          step={step}
          canProceed={canProceed(step)}
          onPrev={prevStep}
          onNext={nextStep}
          isLast={step === 5}
        />
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  const t = useCopy();
  const labels = STEP_KEYS.map((k) => t(k));
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.25rem',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
      }}
    >
      {labels.map((label, i) => {
        const num = i + 1;
        const isActive = num === step;
        const isCompleted = num < step;
        return (
          <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className={`booking-step-circle${
                isActive ? ' booking-step-circle--active' : ''
              }${isCompleted ? ' booking-step-circle--completed' : ''}`}
            >
              {isCompleted ? <Check size={14} /> : num}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
              className="booking-helper"
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <span
                className={`booking-step-line${
                  isCompleted ? ' booking-step-line--completed' : ''
                }`}
                style={{ width: '1.5rem', height: 1 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Nav({
  step,
  canProceed,
  onPrev,
  onNext,
  isLast,
}: {
  step: number;
  canProceed: boolean;
  onPrev: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const t = useCopy();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2rem',
      }}
    >
      <button
        type="button"
        className="booking-cta booking-cta--secondary"
        onClick={onPrev}
        style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
      >
        <ChevronLeft size={16} /> {t('navBack')}
      </button>
      {!isLast && (
        <button
          type="button"
          className="booking-cta"
          onClick={onNext}
          disabled={!canProceed}
        >
          {t('navNext')} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function firstName(full: string): string {
  return full.split(/\s+/)[0] || full;
}

function mapErrorCode(code: string | undefined, t: (k: 'errorsSlotJustTaken' | 'errorsRateLimited' | 'errorsScheduleChanged' | 'errorsCaptchaFailed' | 'errorsGeneric' | 'errorsNetworkError') => string): string {
  switch (code) {
    case 'slot_just_taken':
    case 'slot_unavailable':
      return t('errorsSlotJustTaken');
    case 'rate_limited':
    case 'too_many_pending_for_phone':
      return t('errorsRateLimited');
    case 'service_unavailable':
    case 'no_qualified_technicians':
      return t('errorsScheduleChanged');
    default:
      return t('errorsGeneric');
  }
}

