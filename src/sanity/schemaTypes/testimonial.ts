import { defineField, defineType } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'quote', type: 'text' }),
    defineField({ name: 'author', type: 'string' }),
    defineField({ name: 'service', type: 'string' }),
    defineField({ name: 'order', type: 'number' }),
  ],
});
