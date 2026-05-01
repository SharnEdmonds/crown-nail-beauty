import { defineField, defineType } from 'sanity';

const HEX_REGEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const colorField = (
  name: string,
  title: string,
  description: string,
  group: string,
  required = true,
  initialValue?: string,
) =>
  defineField({
    name,
    title,
    type: 'string',
    description,
    group,
    initialValue,
    validation: (Rule) => {
      const base = Rule.regex(HEX_REGEX, {
        name: 'hex color',
        invert: false,
      }).warning('Use a 6- or 8-digit hex color (e.g. #C9A962).');
      return required ? base.required() : base;
    },
  });

const imageWithAlt = (name: string, title: string, description: string, group: string) =>
  defineField({
    name,
    title,
    type: 'image',
    description,
    group,
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
  });

export const bookingTheme = defineType({
  name: 'bookingTheme',
  title: 'Booking Theme',
  type: 'document',
  description:
    'Colors, fonts, logos, radii used by the booking wizard, admin and emails. Edit hex values to retheme without redeploying.',
  groups: [
    { name: 'logos', title: 'Logos' },
    { name: 'core', title: 'Core colors' },
    { name: 'overrides', title: 'Optional overrides' },
    { name: 'typography', title: 'Typography' },
    { name: 'radius', title: 'Radius' },
    { name: 'email', title: 'Email' },
  ],
  fields: [
    imageWithAlt(
      'logoPrimary',
      'Primary logo',
      'Wizard header, success page, and email header.',
      'logos',
    ),
    imageWithAlt('logoSubmark', 'Submark / icon logo', 'Compact mark for tight spaces.', 'logos'),
    imageWithAlt(
      'logoEmailHeader',
      'Email header banner',
      'Recommended 600×120 banner used at the top of every transactional email.',
      'logos',
    ),
    colorField(
      'colorBackground',
      'Background',
      'Page background (booking page and admin).',
      'core',
      true,
      '#E8E4E0',
    ),
    colorField(
      'colorSurface',
      'Surface',
      'Card / panel background.',
      'core',
      true,
      '#FAFAFA',
    ),
    colorField(
      'colorSurfaceMuted',
      'Surface (muted)',
      'Hover / secondary card backgrounds.',
      'core',
      true,
      '#F0EDE9',
    ),
    colorField('colorBorder', 'Border', 'Dividers and input borders.', 'core', true, '#D9D5D1'),
    colorField(
      'colorBorderFocus',
      'Border (focus)',
      'Focused input border, active step ring.',
      'core',
      true,
      '#C9A962',
    ),
    colorField(
      'colorTextPrimary',
      'Text primary',
      'Headlines and body text.',
      'core',
      true,
      '#1A1A1A',
    ),
    colorField(
      'colorTextSecondary',
      'Text secondary',
      'Labels and helper text.',
      'core',
      true,
      '#4A4A4A',
    ),
    colorField(
      'colorTextMuted',
      'Text muted',
      'Placeholders and disabled text.',
      'core',
      true,
      '#8A8A8A',
    ),
    colorField(
      'colorAccent',
      'Accent',
      'Primary CTA, selected items, active step.',
      'core',
      true,
      '#C9A962',
    ),
    colorField(
      'colorAccentMuted',
      'Accent (muted)',
      'Soft accent backgrounds and badges.',
      'core',
      true,
      '#E8D7B0',
    ),
    colorField(
      'colorSuccess',
      'Success',
      'Confirmation states and refunded badges.',
      'core',
      true,
      '#3D8B5C',
    ),
    colorField(
      'colorWarning',
      'Warning',
      'Pending payment and soft warnings.',
      'core',
      true,
      '#C77F2A',
    ),
    colorField(
      'colorError',
      'Error',
      'Error toasts and validation messages.',
      'core',
      true,
      '#B8493A',
    ),
    colorField(
      'colorOnAccent',
      'Text on accent',
      'Text/icon color when ON the accent background. Usually white.',
      'core',
      true,
      '#FFFFFF',
    ),
    colorField(
      'colorStepActive',
      'Step active (optional)',
      'Active step circle. Falls back to accent if blank.',
      'overrides',
      false,
    ),
    colorField(
      'colorStepCompleted',
      'Step completed (optional)',
      'Completed step circle. Falls back to accent muted if blank.',
      'overrides',
      false,
    ),
    colorField(
      'colorStepPending',
      'Step pending (optional)',
      'Future step circle. Falls back to border color if blank.',
      'overrides',
      false,
    ),
    colorField(
      'colorSlotAvailable',
      'Slot available (optional)',
      'Available time-slot button. Falls back to surface if blank.',
      'overrides',
      false,
    ),
    colorField(
      'colorSlotSelected',
      'Slot selected (optional)',
      'Selected time-slot button. Falls back to accent if blank.',
      'overrides',
      false,
    ),
    colorField(
      'colorSlotUnavailable',
      'Slot unavailable (optional)',
      'Disabled time-slot. Falls back to surface muted if blank.',
      'overrides',
      false,
    ),
    defineField({
      name: 'headingFontFamily',
      title: 'Heading font family',
      type: 'string',
      description: 'CSS font-family stack. Example: "Cormorant Garamond, serif".',
      group: 'typography',
      initialValue: '"Cormorant Garamond", Georgia, serif',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bodyFontFamily',
      title: 'Body font family',
      type: 'string',
      description: 'CSS font-family stack.',
      group: 'typography',
      initialValue: 'Satoshi, system-ui, sans-serif',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'monoFontFamily',
      title: 'Mono font family',
      type: 'string',
      description: 'Used for prices and numerical displays.',
      group: 'typography',
      initialValue: 'ui-monospace, SFMono-Regular, monospace',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'radiusSm',
      title: 'Radius small',
      type: 'string',
      group: 'radius',
      initialValue: '2px',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'radiusMd',
      title: 'Radius medium',
      type: 'string',
      group: 'radius',
      initialValue: '4px',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'radiusLg',
      title: 'Radius large',
      type: 'string',
      group: 'radius',
      initialValue: '8px',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'radiusFull',
      title: 'Radius full (pill)',
      type: 'string',
      group: 'radius',
      initialValue: '9999px',
      validation: (Rule) => Rule.required(),
    }),
    colorField(
      'emailBackgroundColor',
      'Email page background',
      'Outer body color of transactional emails.',
      'email',
      true,
      '#F0EDE9',
    ),
    colorField(
      'emailCardColor',
      'Email card background',
      'Inner card color of transactional emails.',
      'email',
      true,
      '#FFFFFF',
    ),
    defineField({
      name: 'emailFooterText',
      title: 'Email footer block',
      type: 'array',
      group: 'email',
      description: 'Small footer block on every email.',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Booking Theme' };
    },
  },
});
