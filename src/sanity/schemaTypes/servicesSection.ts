import { defineField, defineType } from 'sanity';

export const servicesSection = defineType({
  name: 'servicesSection',
  title: 'Services Section',
  type: 'document',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'intro', type: 'text' }),
    defineField({ name: 'startingFromLabel', type: 'string' }),
    defineField({
      name: 'cards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'description', type: 'text' }),
            defineField({ name: 'href', type: 'string' }),
            defineField({
              name: 'categorySlugs',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Slugs of serviceCategory docs to derive "starting from" price',
            }),
          ],
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Services Section' }) },
});
