import { defineField, defineType } from 'sanity';

export const bookingCtaSection = defineType({
  name: 'bookingCtaSection',
  title: 'Booking CTA Section',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'headingStart', type: 'string' }),
    defineField({ name: 'headingItalic', type: 'string' }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Booking CTA Section' }) },
});
