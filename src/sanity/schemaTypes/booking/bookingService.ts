import { defineField, defineType } from 'sanity';

export const bookingService = defineType({
  name: 'bookingService',
  title: 'Service',
  type: 'document',
  description: 'A bookable service. Variants (Short / Long etc.) are separate documents.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Short blurb shown on the service card in the booking wizard.',
    }),
    defineField({
      name: 'durationMinutes',
      title: 'Duration (minutes)',
      type: 'number',
      description: 'How long the appointment takes from start to finish.',
      validation: (Rule) => Rule.required().min(15).max(480).integer(),
    }),
    defineField({
      name: 'bufferMinutes',
      title: 'Buffer / cleanup (minutes)',
      type: 'number',
      description: 'Time blocked AFTER the booking for cleanup. Adds to the slot length.',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(60).integer(),
    }),
    defineField({
      name: 'price',
      title: 'Full price (NZD)',
      type: 'number',
      description: 'Total service price in dollars. Example: 60 or 60.00.',
      validation: (Rule) => Rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'deposit',
      title: 'Deposit (NZD)',
      type: 'number',
      description:
        'Charged at booking via Stripe. Balance paid in salon. Must be ≤ full price.',
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .precision(2)
          .custom((deposit, ctx) => {
            const price = (ctx.document?.price ?? 0) as number;
            if (typeof deposit === 'number' && deposit > price) {
              return 'Deposit cannot exceed the full price.';
            }
            return true;
          }),
    }),
    defineField({
      name: 'linkedCategorySlug',
      title: 'Linked menu category slug (optional)',
      type: 'string',
      description:
        'References the existing serviceCategory.slug for display grouping in the wizard. Optional.',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 100,
    }),
    defineField({
      name: 'isActive',
      title: 'Active (bookable)',
      type: 'boolean',
      description: 'Hide from booking without deleting. Existing bookings stay valid.',
      initialValue: true,
    }),
    defineField({
      name: 'imageOptional',
      title: 'Image (optional)',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((alt, ctx) => {
              const hasImage = !!(ctx.parent as { asset?: unknown })?.asset;
              if (hasImage && !alt) return 'Alt text is required when an image is set.';
              return true;
            }),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      duration: 'durationMinutes',
      price: 'price',
      deposit: 'deposit',
      active: 'isActive',
      media: 'imageOptional',
    },
    prepare({ title, duration, price, deposit, active, media }) {
      const priceStr = typeof price === 'number' ? `$${price.toFixed(2)}` : '—';
      const depositStr = typeof deposit === 'number' ? `$${deposit.toFixed(2)}` : '—';
      const status = active ? '' : ' • inactive';
      return {
        title: title || 'Untitled service',
        subtitle: `${duration ?? '?'}m • ${priceStr} (deposit ${depositStr})${status}`,
        media,
      };
    },
  },
  orderings: [
    { title: 'Sort order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Title A-Z', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
  ],
});
