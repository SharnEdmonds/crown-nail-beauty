import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'businessName', type: 'string' }),
    defineField({ name: 'tagline', type: 'string' }),
    defineField({ name: 'logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'logoWordmark', type: 'string', description: 'Large text in nav/footer (e.g. CROWN)' }),
    defineField({ name: 'logoSubmark', type: 'string', description: 'Small text under wordmark (e.g. NAIL & BEAUTY)' }),
    defineField({ name: 'heroHeadline', type: 'text', rows: 3, description: 'Headline text. The 3rd word will render in italic with indent.' }),
    defineField({
      name: 'heroCtaPrimary',
      type: 'object',
      fields: [
        defineField({ name: 'label', type: 'string' }),
        defineField({ name: 'href', type: 'string' }),
      ],
    }),
    defineField({
      name: 'heroCtaSecondary',
      type: 'object',
      fields: [
        defineField({ name: 'label', type: 'string' }),
        defineField({ name: 'href', type: 'string' }),
      ],
    }),
    defineField({ name: 'heroScrollLabel', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({
      name: 'address',
      type: 'object',
      fields: [
        defineField({ name: 'street', type: 'string' }),
        defineField({ name: 'suburb', type: 'string' }),
        defineField({ name: 'city', type: 'string' }),
        defineField({ name: 'postcode', type: 'string' }),
      ],
    }),
    defineField({
      name: 'openingHours',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'days', type: 'string' }),
            defineField({ name: 'hours', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'socialLinks',
      type: 'object',
      fields: [
        defineField({ name: 'instagram', type: 'url' }),
        defineField({ name: 'facebook', type: 'url' }),
      ],
    }),
    defineField({ name: 'aboutEyebrow', type: 'string', description: 'e.g. "Est. 2024 — Demo City"' }),
    defineField({ name: 'aboutHeading', type: 'string' }),
    defineField({ name: 'aboutParagraphs', type: 'array', of: [{ type: 'text' }] }),
    defineField({ name: 'aboutImage', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'aboutCtaLabel', type: 'string' }),
    defineField({ name: 'aboutCtaHref', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
});
