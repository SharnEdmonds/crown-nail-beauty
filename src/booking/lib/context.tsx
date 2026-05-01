'use client';

// Booking-module React context. Provides bookingCopy + bookingTheme to every wizard/admin component.
// Supplied at the layout level by server components; consumed via useCopy / useTheme hooks.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { PortableTextBlock } from '@sanity/types';
import type { BookingCopy, BookingTheme } from './types';
import { COPY_DEFAULTS } from './copy-defaults';
import {
  renderTemplate,
  renderPortableText,
  type TemplateVars,
} from './templating';

interface BookingContextValue {
  copy: BookingCopy | null;
  theme: BookingTheme | null;
}

const BookingContext = createContext<BookingContextValue>({
  copy: null,
  theme: null,
});

export function BookingProvider({
  copy,
  theme,
  children,
}: {
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ copy, theme }), [copy, theme]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

/**
 * Resolve a copy field by key, applying defaults and template-variable substitution.
 *
 * Usage:
 *   const t = useCopy();
 *   <h2>{t('serviceHeading')}</h2>
 *   <span>{t('wizardWelcomeBackTemplate', { firstName: 'Sarah' })}</span>
 *
 * For Portable Text fields, returns the rendered tree:
 *   const pt = useCopyPortableText();
 *   <PortableText value={pt('successBodyTemplate', { service, tech })} />
 */
export function useCopy() {
  const { copy } = useContext(BookingContext);
  return useCallback(
    <K extends keyof typeof COPY_DEFAULTS>(key: K, vars?: TemplateVars): string => {
      const fromCms = (copy as Record<string, unknown> | null)?.[key as string];
      const fromDefault = COPY_DEFAULTS[key];
      // Only use string fields. Portable Text fields go through useCopyPortableText.
      if (typeof fromCms === 'string' && fromCms.length > 0) {
        return renderTemplate(fromCms, vars, key as string);
      }
      if (typeof fromDefault === 'string') {
        return renderTemplate(fromDefault, vars, key as string);
      }
      return '';
    },
    [copy],
  );
}

export function useCopyPortableText() {
  const { copy } = useContext(BookingContext);
  return useCallback(
    <K extends keyof typeof COPY_DEFAULTS>(
      key: K,
      vars?: TemplateVars,
    ): PortableTextBlock[] => {
      const fromCms = (copy as Record<string, unknown> | null)?.[key as string];
      const fromDefault = COPY_DEFAULTS[key];
      if (Array.isArray(fromCms) && fromCms.length > 0) {
        return renderPortableText(fromCms as PortableTextBlock[], vars, key as string);
      }
      if (Array.isArray(fromDefault)) {
        return renderPortableText(fromDefault as PortableTextBlock[], vars, key as string);
      }
      return [];
    },
    [copy],
  );
}

/**
 * Get an array-typed copy field (e.g. weekdayShort). Returns [] if missing.
 */
export function useCopyArray() {
  const { copy } = useContext(BookingContext);
  return useCallback(
    <K extends keyof typeof COPY_DEFAULTS>(key: K): string[] => {
      const fromCms = (copy as Record<string, unknown> | null)?.[key as string];
      const fromDefault = COPY_DEFAULTS[key];
      if (Array.isArray(fromCms) && fromCms.every((s) => typeof s === 'string')) {
        return fromCms as string[];
      }
      if (Array.isArray(fromDefault) && fromDefault.every((s) => typeof s === 'string')) {
        return fromDefault as string[];
      }
      return [];
    },
    [copy],
  );
}

/**
 * Get an object-typed copy field (e.g. adminBookingStatusLabels).
 */
export function useCopyObject<T extends object>() {
  const { copy } = useContext(BookingContext);
  return useCallback(
    <K extends keyof typeof COPY_DEFAULTS>(key: K): T => {
      const fromCms = (copy as Record<string, unknown> | null)?.[key as string];
      const fromDefault = COPY_DEFAULTS[key];
      if (fromCms && typeof fromCms === 'object' && !Array.isArray(fromCms)) {
        return { ...(fromDefault as object), ...(fromCms as object) } as T;
      }
      return ((fromDefault as unknown) as T) ?? ({} as T);
    },
    [copy],
  );
}

export function useTheme() {
  const { theme } = useContext(BookingContext);
  return theme;
}
