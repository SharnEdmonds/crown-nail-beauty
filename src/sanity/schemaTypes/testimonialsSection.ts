import { defineField, defineType } from 'sanity';

export const testimonialsSection = defineType({
  name: 'testimonialsSection',
  title: 'Testimonials Section',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Testimonials Section' }) },
});
