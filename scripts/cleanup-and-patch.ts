/**
 * Cleanup script: removes duplicate seed docs I created.
 * Run: npx tsx scripts/cleanup-and-patch.ts
 */
import { createClient } from '@sanity/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-31',
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

const seedCategoryIds = [
  'category-gel-polish',
  'category-normal-polish',
  'category-builder-gel',
  'category-dipping-powder',
  'category-eyelash-extension',
  'category-waxing',
  'category-tinting',
  'category-facial-care',
  'category-permanent-makeup',
];

const seedTestimonialIds = ['testimonial-1', 'testimonial-2', 'testimonial-3'];

async function run() {
  console.log('Deleting duplicate seed serviceCategory docs...');
  for (const id of seedCategoryIds) {
    await client.delete(id).catch((e) => console.log(`  skip ${id}: ${e.message}`));
  }
  console.log('Deleting duplicate seed testimonial docs...');
  for (const id of seedTestimonialIds) {
    await client.delete(id).catch((e) => console.log(`  skip ${id}: ${e.message}`));
  }
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
