// Hardcoded fallback theme. Mirrors the demo brand palette
// from tailwind.config.ts. Used when the Sanity bookingTheme document is missing fields.

import type { BookingTheme } from './types';

export const THEME_DEFAULTS: Required<
  Omit<
    BookingTheme,
    | '_id'
    | '_type'
    | 'logoPrimary'
    | 'logoSubmark'
    | 'logoEmailHeader'
    | 'colorStepActive'
    | 'colorStepCompleted'
    | 'colorStepPending'
    | 'colorSlotAvailable'
    | 'colorSlotSelected'
    | 'colorSlotUnavailable'
    | 'emailFooterText'
  >
> = {
  // Core 14 — match demo brand
  colorBackground: '#E8E4E0', // marble-stone
  colorSurface: '#FAFAFA', // clean-white
  colorSurfaceMuted: '#F0EDE9',
  colorBorder: '#D9D5D1',
  colorBorderFocus: '#C9A962', // brushed-gold
  colorTextPrimary: '#1A1A1A', // crown-black
  colorTextSecondary: '#4A4A4A', // charcoal-grey
  colorTextMuted: '#8A8A8A', // stone-grey
  colorAccent: '#C9A962', // brushed-gold
  colorAccentMuted: '#E8D7B0',
  colorSuccess: '#3D8B5C',
  colorWarning: '#C77F2A',
  colorError: '#B8493A',
  colorOnAccent: '#FFFFFF',

  // Typography
  headingFontFamily: '"Cormorant Garamond", Georgia, serif',
  bodyFontFamily: 'Satoshi, system-ui, sans-serif',
  monoFontFamily: 'ui-monospace, SFMono-Regular, monospace',

  // Radius
  radiusSm: '2px',
  radiusMd: '4px',
  radiusLg: '8px',
  radiusFull: '9999px',

  // Email
  emailBackgroundColor: '#F0EDE9',
  emailCardColor: '#FFFFFF',
};
