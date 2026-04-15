import { defineField, defineType } from 'sanity';

export const portfolioSection = defineType({
  name: 'portfolioSection',
  title: 'Portfolio Section',
  type: 'document',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'description', type: 'string' }),
    defineField({ name: 'viewDetailsLabel', type: 'string' }),
    defineField({
      name: 'images',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
            defineField({ name: 'alt', type: 'string' }),
          ],
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Portfolio Section' }) },
});
