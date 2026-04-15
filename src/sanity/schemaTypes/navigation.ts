import { defineField, defineType } from 'sanity';

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'links',
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
    defineField({ name: 'reserveLabel', type: 'string' }),
    defineField({ name: 'reserveHref', type: 'string' }),
    defineField({ name: 'mobileHomeLabel', type: 'string' }),
    defineField({ name: 'mobileHomeHref', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Navigation' }) },
});
