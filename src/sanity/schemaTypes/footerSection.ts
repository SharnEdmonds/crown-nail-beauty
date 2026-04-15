import { defineField, defineType } from 'sanity';

export const footerSection = defineType({
  name: 'footerSection',
  title: 'Footer Section',
  type: 'document',
  fields: [
    defineField({ name: 'brandDescription', type: 'text' }),
    defineField({ name: 'hoursHeading', type: 'string' }),
    defineField({ name: 'exploreHeading', type: 'string' }),
    defineField({
      name: 'exploreLinks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'href', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({ name: 'visitHeading', type: 'string' }),
    defineField({ name: 'copyrightSuffix', type: 'string', description: 'e.g. "NZ. All rights reserved."' }),
  ],
  preview: { prepare: () => ({ title: 'Footer Section' }) },
});
