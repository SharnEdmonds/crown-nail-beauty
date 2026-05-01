'use client';

import { BookingProvider } from '@/booking/lib/context';
import { BookingWizard } from './BookingWizard';
import type {
  BookingCopy,
  BookingService,
  BookingSettings,
  BookingTheme,
  Technician,
} from '@/booking/lib/types';

export interface RecognizedCustomer {
  name: string;
  phone: string;
  email: string | null;
}

export function BookingPageClient(props: {
  copy: BookingCopy | null;
  theme: BookingTheme | null;
  settings: BookingSettings | null;
  services: BookingService[];
  technicians: Technician[];
  recognizedCustomer: RecognizedCustomer | null;
}) {
  return (
    <BookingProvider copy={props.copy} theme={props.theme}>
      <BookingWizard
        settings={props.settings}
        services={props.services}
        technicians={props.technicians}
        recognizedCustomer={props.recognizedCustomer}
      />
    </BookingProvider>
  );
}
