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
      name: 'autoRotate',
      title: 'Auto-rotate featured image',
      type: 'boolean',
      description: 'When on, the featured image cycles through the gallery automatically. Pauses on hover, when off-screen, and when the visitor has reduced-motion enabled.',
    }),
    defineField({
      name: 'rotationSeconds',
      title: 'Rotation interval (seconds)',
      type: 'number',
      description: 'How often to advance the featured image when auto-rotation is on. Default: 6.',
      validation: (Rule) => Rule.min(2).max(30),
    }),
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
