import { defineField, defineType } from 'sanity';

export const bookingSettings = defineType({
  name: 'bookingSettings',
  title: 'Booking Settings',
  type: 'document',
  description: 'Operational configuration for the booking system. Singleton.',
  groups: [
    { name: 'general', title: 'General' },
    { name: 'window', title: 'Booking window' },
    { name: 'closures', title: 'Closures' },
    { name: 'policies', title: 'Policies' },
    { name: 'notifications', title: 'Notifications' },
  ],
  fields: [
    defineField({
      name: 'isBookingEnabled',
      title: 'Booking enabled',
      type: 'boolean',
      description: 'Global kill switch. When off, the booking page is disabled.',
      initialValue: true,
      group: 'general',
    }),
    defineField({
      name: 'salonTimezone',
      title: 'Salon timezone (IANA)',
      type: 'string',
      description: 'IANA timezone identifier. Default: UTC.',
      initialValue: 'UTC',
      group: 'general',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slotIntervalMinutes',
      title: 'Slot interval (minutes)',
      type: 'number',
      description: 'Granularity of bookable start times. Typical: 30.',
      initialValue: 30,
      group: 'window',
      validation: (Rule) => Rule.required().min(5).max(120).integer(),
    }),
    defineField({
      name: 'minHoursAheadToBook',
      title: 'Minimum hours ahead to book',
      type: 'number',
      description:
        'Customers must book at least this many hours in advance. Prevents same-hour bookings and gives techs prep time.',
      initialValue: 2,
      group: 'window',
      validation: (Rule) => Rule.required().min(0).max(72).integer(),
    }),
    defineField({
      name: 'maxDaysAheadToBook',
      title: 'Maximum days ahead to book',
      type: 'number',
      description: 'How far ahead customers can book. Default: 30 days.',
      initialValue: 30,
      group: 'window',
      validation: (Rule) => Rule.required().min(1).max(365).integer(),
    }),
    defineField({
      name: 'cancellationCutoffHours',
      title: 'Self-cancel cutoff (hours)',
      type: 'number',
      description:
        'Customers can self-cancel up to this many hours before the appointment. Inside this window they must phone the salon.',
      initialValue: 24,
      group: 'policies',
      validation: (Rule) => Rule.required().min(0).max(168).integer(),
    }),
    defineField({
      name: 'pendingPaymentTtlMinutes',
      title: 'Pending payment hold (minutes)',
      type: 'number',
      description:
        'How long a slot is held for an unpaid pending booking before expiring. Default: 15.',
      initialValue: 15,
      group: 'window',
      validation: (Rule) => Rule.required().min(5).max(60).integer(),
    }),
    defineField({
      name: 'publicHolidayDates',
      title: 'Public holidays / salon closures',
      type: 'array',
      description: 'Dates when the salon is fully closed. Overrides all technician schedules.',
      group: 'closures',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'date',
              title: 'Date',
              type: 'date',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label (optional, admin-only)',
              type: 'string',
            }),
          ],
          preview: {
            select: { date: 'date', label: 'label' },
            prepare({ date, label }) {
              return { title: date || 'New holiday', subtitle: label };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'cancellationPolicyText',
      title: 'Cancellation policy',
      type: 'array',
      description: 'Shown on the booking review step and included in confirmation emails.',
      group: 'policies',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [],
          },
        },
      ],
    }),
    defineField({
      name: 'privacyPolicyText',
      title: 'Privacy policy (rendered at /privacy)',
      type: 'array',
      group: 'policies',
      of: [
        {
          type: 'block',
        },
      ],
    }),
    defineField({
      name: 'ownerNotificationEmails',
      title: 'Owner notification emails',
      type: 'array',
      description: 'Emails to notify when a new booking is confirmed.',
      group: 'notifications',
      of: [
        {
          type: 'string',
          validation: (Rule) =>
            Rule.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { name: 'email' }),
        },
      ],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'contactPhoneOverride',
      title: 'Contact phone (optional)',
      type: 'string',
      description:
        'Shown on cancellation pages when the customer is inside the cancel cutoff. Falls back to siteSettings.contactPhone.',
      group: 'policies',
    }),
    defineField({
      name: 'smsRemindersEnabled',
      title: 'Send SMS reminders 24h before appointment',
      type: 'boolean',
      description:
        'Requires Twilio credentials in env vars. Customers without a phone on file are skipped.',
      initialValue: false,
      group: 'notifications',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Booking Settings' };
    },
  },
});
