// Converts a BookingTheme document (with optional fields) into a CSS string
// of `:root` (or scoped) custom properties. Optional override fields fall back
// to sensible defaults derived from the core palette.

import type { BookingTheme } from './types';
import { THEME_DEFAULTS } from './theme-defaults';

/**
 * Resolve every CSS variable from a theme document, applying defaults and
 * fallback rules for optional override colors.
 */
export function resolveThemeVars(
  theme: Partial<BookingTheme> | null | undefined,
): Record<string, string> {
  const t = theme ?? {};

  // Core required colors — always fall back to brand defaults.
  const colorBackground = t.colorBackground || THEME_DEFAULTS.colorBackground;
  const colorSurface = t.colorSurface || THEME_DEFAULTS.colorSurface;
  const colorSurfaceMuted = t.colorSurfaceMuted || THEME_DEFAULTS.colorSurfaceMuted;
  const colorBorder = t.colorBorder || THEME_DEFAULTS.colorBorder;
  const colorBorderFocus = t.colorBorderFocus || THEME_DEFAULTS.colorBorderFocus;
  const colorTextPrimary = t.colorTextPrimary || THEME_DEFAULTS.colorTextPrimary;
  const colorTextSecondary = t.colorTextSecondary || THEME_DEFAULTS.colorTextSecondary;
  const colorTextMuted = t.colorTextMuted || THEME_DEFAULTS.colorTextMuted;
  const colorAccent = t.colorAccent || THEME_DEFAULTS.colorAccent;
  const colorAccentMuted = t.colorAccentMuted || THEME_DEFAULTS.colorAccentMuted;
  const colorSuccess = t.colorSuccess || THEME_DEFAULTS.colorSuccess;
  const colorWarning = t.colorWarning || THEME_DEFAULTS.colorWarning;
  const colorError = t.colorError || THEME_DEFAULTS.colorError;
  const colorOnAccent = t.colorOnAccent || THEME_DEFAULTS.colorOnAccent;

  // Optional overrides — fall back to logical core counterparts.
  const colorStepActive = t.colorStepActive || colorAccent;
  const colorStepCompleted = t.colorStepCompleted || colorAccentMuted;
  const colorStepPending = t.colorStepPending || colorBorder;
  const colorSlotAvailable = t.colorSlotAvailable || colorSurface;
  const colorSlotSelected = t.colorSlotSelected || colorAccent;
  const colorSlotUnavailable = t.colorSlotUnavailable || colorSurfaceMuted;

  return {
    '--booking-color-bg': colorBackground,
    '--booking-color-surface': colorSurface,
    '--booking-color-surface-muted': colorSurfaceMuted,
    '--booking-color-border': colorBorder,
    '--booking-color-border-focus': colorBorderFocus,
    '--booking-color-text-primary': colorTextPrimary,
    '--booking-color-text-secondary': colorTextSecondary,
    '--booking-color-text-muted': colorTextMuted,
    '--booking-color-accent': colorAccent,
    '--booking-color-accent-muted': colorAccentMuted,
    '--booking-color-success': colorSuccess,
    '--booking-color-warning': colorWarning,
    '--booking-color-error': colorError,
    '--booking-color-on-accent': colorOnAccent,

    '--booking-color-step-active': colorStepActive,
    '--booking-color-step-completed': colorStepCompleted,
    '--booking-color-step-pending': colorStepPending,
    '--booking-color-slot-available': colorSlotAvailable,
    '--booking-color-slot-selected': colorSlotSelected,
    '--booking-color-slot-unavailable': colorSlotUnavailable,

    '--booking-heading-font': t.headingFontFamily || THEME_DEFAULTS.headingFontFamily,
    '--booking-body-font': t.bodyFontFamily || THEME_DEFAULTS.bodyFontFamily,
    '--booking-mono-font': t.monoFontFamily || THEME_DEFAULTS.monoFontFamily,

    '--booking-radius-sm': t.radiusSm || THEME_DEFAULTS.radiusSm,
    '--booking-radius-md': t.radiusMd || THEME_DEFAULTS.radiusMd,
    '--booking-radius-lg': t.radiusLg || THEME_DEFAULTS.radiusLg,
    '--booking-radius-full': t.radiusFull || THEME_DEFAULTS.radiusFull,

    '--booking-email-bg': t.emailBackgroundColor || THEME_DEFAULTS.emailBackgroundColor,
    '--booking-email-card': t.emailCardColor || THEME_DEFAULTS.emailCardColor,
  };
}

/**
 * Render a stylesheet string scoped to `.booking-root`. Inject into a <style> tag
 * on any layout that hosts booking surfaces.
 */
export function themeCssText(theme: Partial<BookingTheme> | null | undefined): string {
  const vars = resolveThemeVars(theme);
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);
  return `.booking-root {\n${lines.join('\n')}\n}`;
}
