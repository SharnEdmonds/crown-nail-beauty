import { defineField, defineType } from 'sanity';

export const serviceCategory = defineType({
  name: 'serviceCategory',
  title: 'Service Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'priceFrom', type: 'string' }),
    defineField({ name: 'order', type: 'number' }),
    defineField({
      name: 'services',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string' }),
            defineField({ name: 'price', type: 'string' }),
            defineField({ name: 'note', type: 'string' }),
          ],
        },
      ],
    }),
  ],
});
