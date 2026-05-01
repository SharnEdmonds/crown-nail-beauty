import type { SchemaTypeDefinition } from 'sanity';
import { bookingService } from './bookingService';
import { technician } from './technician';
import { bookingSettings } from './bookingSettings';
import { bookingTheme } from './bookingTheme';
import { bookingCopy } from './bookingCopy';

export const bookingSchemas: SchemaTypeDefinition[] = [
  bookingService,
  technician,
  bookingSettings,
  bookingTheme,
  bookingCopy,
];

export const BOOKING_SINGLETON_TYPES = new Set([
  'bookingSettings',
  'bookingTheme',
  'bookingCopy',
]);

export const BOOKING_DOC_TYPES = new Set([
  'bookingService',
  'technician',
  'bookingSettings',
  'bookingTheme',
  'bookingCopy',
]);
