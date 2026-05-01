import type { StructureResolver } from 'sanity/structure';
import { BOOKING_DOC_TYPES, BOOKING_SINGLETON_TYPES } from './schemaTypes/booking';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Content')
        .child(
          S.list()
            .title('Site Content')
            .items(
              S.documentTypeListItems().filter(
                (item) => !BOOKING_DOC_TYPES.has(item.getId() ?? ''),
              ),
            ),
        ),
      S.divider(),
      S.listItem()
        .title('Booking')
        .child(
          S.list()
            .title('Booking')
            .items([
              S.documentTypeListItem('bookingSettings').title('Booking Settings'),
              S.documentTypeListItem('bookingTheme').title('Booking Theme'),
              S.documentTypeListItem('bookingCopy').title('Booking Copy'),
              S.divider(),
              S.documentTypeListItem('bookingService').title('Services'),
              S.documentTypeListItem('technician').title('Technicians'),
            ]),
        ),
    ]);

// Re-export so consumers (config) can use them.
export { BOOKING_SINGLETON_TYPES };
