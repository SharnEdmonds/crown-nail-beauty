import { defineField, defineType } from 'sanity';

const vector3 = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({ name: 'x', type: 'number' }),
      defineField({ name: 'y', type: 'number' }),
      defineField({ name: 'z', type: 'number' }),
    ],
    options: { columns: 3 },
  });

export const handModel = defineType({
  name: 'handModel',
  title: '3D Hand Model',
  type: 'document',
  fields: [
    defineField({
      name: 'idleRotationSpeed',
      title: 'Idle Rotation Speed (radians/sec)',
      type: 'number',
      description: 'Continuous Y-axis spin speed. Default: 0.15',
    }),
    defineField({
      name: 'idleWobbleAmount',
      title: 'Idle Z Wobble Amount',
      type: 'number',
      description: 'Amplitude of the gentle side-to-side tilt. Default: 0.02',
    }),
    defineField({
      name: 'idleWobbleSpeed',
      title: 'Idle Z Wobble Speed',
      type: 'number',
      description: 'Frequency of the side-to-side tilt. Default: 0.25',
    }),
    defineField({
      name: 'scale',
      title: 'Model Scale',
      type: 'number',
      description: 'Default: 2.5',
    }),
    defineField({
      name: 'color',
      title: 'Skin Color (hex)',
      type: 'string',
      description: 'Hex color like #e8beac. Default: #e8beac',
      validation: (Rule) => Rule.regex(/^#([0-9a-fA-F]{6})$/, { name: 'hex color' }).error('Must be a 6-digit hex like #e8beac'),
    }),
    defineField({
      name: 'roughness',
      title: 'Material Roughness (0–1)',
      type: 'number',
      description: 'Default: 0.7',
      validation: (Rule) => Rule.min(0).max(1),
    }),
    defineField({
      name: 'metalness',
      title: 'Material Metalness (0–1)',
      type: 'number',
      description: 'Default: 0.1',
      validation: (Rule) => Rule.min(0).max(1),
    }),
    defineField({
      name: 'desktopStartPosition',
      title: 'Desktop — Start Position',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
    defineField({
      name: 'desktopStartRotation',
      title: 'Desktop — Start Rotation (radians)',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
    defineField({
      name: 'desktopEndPosition',
      title: 'Desktop — End Position',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
    defineField({
      name: 'desktopEndRotation',
      title: 'Desktop — End Rotation (radians)',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
    defineField({
      name: 'mobileStartPosition',
      title: 'Mobile — Start Position',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
    defineField({
      name: 'mobileStartRotation',
      title: 'Mobile — Start Rotation (radians)',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
    defineField({
      name: 'mobileEndPosition',
      title: 'Mobile — End Position',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
    defineField({
      name: 'mobileEndRotation',
      title: 'Mobile — End Rotation (radians)',
      type: 'object',
      fields: [
        defineField({ name: 'x', type: 'number' }),
        defineField({ name: 'y', type: 'number' }),
        defineField({ name: 'z', type: 'number' }),
      ],
      options: { columns: 3 },
    }),
  ],
  preview: { prepare: () => ({ title: '3D Hand Model' }) },
});
