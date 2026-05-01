/**
 * Brand-only patch for an existing Sanity dataset.
 *
 * Only updates fields that carry the salon's *identity* (name, contact,
 * address, "we are X" copy) — leaves services, prices, testimonials, gallery,
 * navigation, hero/footer headings, booking copy, themes, and settings alone.
 *
 * Safe to re-run. Uses .patch().set() so any field not listed here keeps its
 * current value, and createIfNotExists guards the singleton in case it isn't
 * in the dataset yet.
 *
 * Run: npx tsx scripts/rebrand-patch.ts
 */
import { createClient } from '@sanity/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID missing in .env.local');
if (!dataset) throw new Error('NEXT_PUBLIC_SANITY_DATASET missing in .env.local');
if (!token) throw new Error('SANITY_API_WRITE_TOKEN missing in .env.local');

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-31',
  token,
  useCdn: false,
});

// ─── Fields to patch ─────────────────────────────────────────────────

const SITE_SETTINGS_PATCH = {
  businessName: 'Atelier Lumière',
  logoWordmark: 'ATELIER',
  logoSubmark: 'LUMIÈRE STUDIO',
  phone: '+1 555 0100',
  email: 'hello@example.com',
  address: {
    street: '1 Sample Street',
    suburb: 'Demo District',
    city: 'Demo City',
    postcode: '00000',
  },
  aboutEyebrow: 'Est. 2024 — Demo Studio',
  aboutHeading: 'The Atelier Philosophy',
  aboutParagraphs: [
    "At Atelier Lumière, we believe beauty is not just a service — it's an art form. Every brushstroke, every detail, every moment in our studio is crafted with the same precision and passion that defines true artistry.",
    'Our intimate sanctuary is where skilled technicians meet discerning clients. We source only premium products, maintain uncompromising hygiene standards, and take the time to understand your unique vision before we begin.',
    'From bespoke nail artistry to flawless lash extensions, every treatment at the Atelier is a personalised experience designed to make you feel truly exceptional.',
  ],
};

const FOOTER_SECTION_PATCH = {
  copyrightSuffix: 'Demo site. All rights reserved.',
};

// ─── Run ─────────────────────────────────────────────────────────────

async function patchOrCreate(id: string, type: string, fields: Record<string, unknown>) {
  // createIfNotExists with the patch fields, then patch — this way the doc
  // shows up in Studio even if it was never seeded, and existing docs only
  // have the listed fields overwritten.
  await client.createIfNotExists({ _id: id, _type: type, ...fields });
  await client.patch(id).set(fields).commit();
  console.log(`  ✓ patched ${id}`);
}

async function run() {
  console.log(`Patching brand identity on dataset "${dataset}"...`);
  await patchOrCreate('siteSettings', 'siteSettings', SITE_SETTINGS_PATCH);
  await patchOrCreate('footerSection', 'footerSection', FOOTER_SECTION_PATCH);
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
