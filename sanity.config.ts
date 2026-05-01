'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure, BOOKING_SINGLETON_TYPES} from './src/sanity/structure'

// Existing site singletons + booking singletons.
const SINGLETON_TYPES = new Set<string>([
  'siteSettings',
  'navigation',
  'servicesSection',
  'serviceMenuSection',
  'portfolioSection',
  'testimonialsSection',
  'bookingCtaSection',
  'footerSection',
  'handModel',
  ...BOOKING_SINGLETON_TYPES,
])

const SINGLETON_BLOCKED_ACTIONS = new Set(['create', 'duplicate', 'delete'])

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  document: {
    actions: (input, context) => {
      if (SINGLETON_TYPES.has(context.schemaType)) {
        return input.filter(({action}) => action && !SINGLETON_BLOCKED_ACTIONS.has(action))
      }
      return input
    },
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type === 'global') {
        return prev.filter((option) => !SINGLETON_TYPES.has(option.templateId ?? ''))
      }
      return prev
    },
  },
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
