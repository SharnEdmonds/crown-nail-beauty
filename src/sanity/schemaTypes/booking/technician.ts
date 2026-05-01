import { defineField, defineType } from 'sanity';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dailyScheduleField = defineField({
  name: 'weeklySchedule',
  title: 'Weekly schedule',
  type: 'array',
  description: 'One entry per day-of-week (0=Sunday, 6=Saturday). All times in salon timezone.',
  validation: (Rule) =>
    Rule.length(7).custom((entries) => {
      if (!Array.isArray(entries)) return true;
      const days = (entries as Array<{ dayOfWeek?: number }>).map((e) => e?.dayOfWeek);
      const expected = [0, 1, 2, 3, 4, 5, 6];
      const sorted = [...days].sort((a, b) => (a ?? -1) - (b ?? -1));
      if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
        return 'Schedule must contain exactly one entry per day-of-week (0–6).';
      }
      return true;
    }),
  of: [
    {
      type: 'object',
      name: 'daySchedule',
      fields: [
        defineField({
          name: 'dayOfWeek',
          title: 'Day of week',
          type: 'number',
          options: {
            list: DAY_NAMES.map((name, idx) => ({ title: name, value: idx })),
          },
          validation: (Rule) => Rule.required().min(0).max(6).integer(),
        }),
        defineField({
          name: 'isWorkingDay',
          title: 'Working day',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'startTime',
          title: 'Start time (HH:mm)',
          type: 'string',
          description: '24h format. Example: 09:00',
          validation: (Rule) =>
            Rule.custom((value, ctx) => {
              const parent = ctx.parent as { isWorkingDay?: boolean } | undefined;
              if (!parent?.isWorkingDay) return true;
              if (!value) return 'Start time is required for a working day.';
              if (!TIME_REGEX.test(value)) return 'Use HH:mm 24-hour format (e.g. 09:00).';
              return true;
            }),
        }),
        defineField({
          name: 'endTime',
          title: 'End time (HH:mm)',
          type: 'string',
          description: '24h format. Must be after start time.',
          validation: (Rule) =>
            Rule.custom((value, ctx) => {
              const parent = ctx.parent as
                | { isWorkingDay?: boolean; startTime?: string }
                | undefined;
              if (!parent?.isWorkingDay) return true;
              if (!value) return 'End time is required for a working day.';
              if (!TIME_REGEX.test(value)) return 'Use HH:mm 24-hour format (e.g. 17:00).';
              if (parent.startTime && value <= parent.startTime) {
                return 'End time must be after start time.';
              }
              return true;
            }),
        }),
        defineField({
          name: 'breakStart',
          title: 'Lunch break start (HH:mm, optional)',
          type: 'string',
          description: 'Optional single break window. Leave blank for no break.',
          validation: (Rule) =>
            Rule.custom((value, ctx) => {
              if (!value) return true;
              if (!TIME_REGEX.test(value)) return 'Use HH:mm 24-hour format.';
              const parent = ctx.parent as
                | { startTime?: string; endTime?: string; breakEnd?: string }
                | undefined;
              if (parent?.startTime && value < parent.startTime) {
                return 'Break must start after working hours start.';
              }
              if (parent?.endTime && value >= parent.endTime) {
                return 'Break must start before working hours end.';
              }
              if (!parent?.breakEnd) return 'Pair with a break end time, or clear both.';
              return true;
            }),
        }),
        defineField({
          name: 'breakEnd',
          title: 'Lunch break end (HH:mm, optional)',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((value, ctx) => {
              if (!value) return true;
              if (!TIME_REGEX.test(value)) return 'Use HH:mm 24-hour format.';
              const parent = ctx.parent as
                | { startTime?: string; endTime?: string; breakStart?: string }
                | undefined;
              if (!parent?.breakStart) return 'Pair with a break start time, or clear both.';
              if (parent.breakStart && value <= parent.breakStart) {
                return 'Break end must be after break start.';
              }
              if (parent.endTime && value > parent.endTime) {
                return 'Break must end before working hours end.';
              }
              return true;
            }),
        }),
      ],
      preview: {
        select: {
          dayOfWeek: 'dayOfWeek',
          isWorkingDay: 'isWorkingDay',
          startTime: 'startTime',
          endTime: 'endTime',
          breakStart: 'breakStart',
          breakEnd: 'breakEnd',
        },
        prepare({ dayOfWeek, isWorkingDay, startTime, endTime, breakStart, breakEnd }) {
          const dayName = DAY_NAMES[dayOfWeek as number] ?? 'Unknown';
          if (!isWorkingDay) return { title: dayName, subtitle: 'Off' };
          const breakStr =
            breakStart && breakEnd ? ` · break ${breakStart}–${breakEnd}` : '';
          return {
            title: dayName,
            subtitle: `${startTime ?? '?'} – ${endTime ?? '?'}${breakStr}`,
          };
        },
      },
    },
  ],
});

export const technician = defineType({
  name: 'technician',
  title: 'Technician',
  type: 'document',
  description:
    'A bookable technician. Assign which services they perform and their weekly schedule.',
  groups: [
    { name: 'identity', title: 'Identity' },
    { name: 'skills', title: 'Skills & schedule' },
    { name: 'timeOff', title: 'Time off' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required().min(1).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'identity',
      options: { source: 'name', maxLength: 64 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      group: 'identity',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((alt, ctx) => {
              const hasImage = !!(ctx.parent as { asset?: unknown })?.asset;
              if (hasImage && !alt) return 'Alt text is required when a photo is set.';
              return true;
            }),
        }),
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Short bio',
      type: 'text',
      rows: 3,
      group: 'identity',
    }),
    defineField({
      name: 'specialty',
      title: 'Specialty (one-line)',
      type: 'string',
      description: 'Shown under the name in the wizard, e.g. "Nail artistry & gel extensions".',
      group: 'identity',
    }),
    defineField({
      name: 'services',
      title: 'Services performed',
      type: 'array',
      description:
        'Which services this technician can perform. Customers will only see this technician for these services.',
      group: 'skills',
      of: [{ type: 'reference', to: [{ type: 'bookingService' }] }],
      validation: (Rule) => Rule.unique(),
    }),
    dailyScheduleField,
    defineField({
      name: 'timeOff',
      title: 'One-off blocked dates',
      type: 'array',
      description:
        'Holidays, sick days, training. Date ranges. For salon-wide closures use Booking Settings → Public Holidays.',
      group: 'timeOff',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'startDate',
              title: 'Start date',
              type: 'date',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'endDate',
              title: 'End date',
              type: 'date',
              description: 'Same as start date for a single day.',
              validation: (Rule) =>
                Rule.required().custom((value, ctx) => {
                  const start = (ctx.parent as { startDate?: string })?.startDate;
                  if (start && value && value < start) return 'End date must be on or after start date.';
                  return true;
                }),
            }),
            defineField({
              name: 'reason',
              title: 'Reason (admin-only)',
              type: 'string',
            }),
          ],
          preview: {
            select: { start: 'startDate', end: 'endDate', reason: 'reason' },
            prepare({ start, end, reason }) {
              const range = start === end ? start : `${start} → ${end}`;
              return { title: range || 'New entry', subtitle: reason };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Active (bookable)',
      type: 'boolean',
      description: 'Hide from booking without deleting. Existing bookings stay valid.',
      initialValue: true,
      group: 'identity',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 100,
      group: 'identity',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      specialty: 'specialty',
      active: 'isActive',
      media: 'photo',
    },
    prepare({ title, specialty, active, media }) {
      return {
        title: title || 'Unnamed technician',
        subtitle: `${specialty ?? ''}${active ? '' : ' • inactive'}`.trim() || undefined,
        media,
      };
    },
  },
  orderings: [
    { title: 'Sort order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Name A-Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
});
