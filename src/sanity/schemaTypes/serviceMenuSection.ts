import { defineField, defineType } from 'sanity';

export const serviceMenuSection = defineType({
  name: 'serviceMenuSection',
  title: 'Service Menu Section',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'headingStart', type: 'string' }),
    defineField({ name: 'headingItalic', type: 'string' }),
    defineField({ name: 'intro', type: 'text' }),
    defineField({ name: 'nailSectionHeadingStart', type: 'string' }),
    defineField({ name: 'nailSectionHeadingItalic', type: 'string' }),
    defineField({
      name: 'nailCategorySlugs',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: { prepare: () => ({ title: 'Service Menu Section' }) },
});
