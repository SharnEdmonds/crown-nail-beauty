/**
 * Read-only inspector — prints every brand-touching field currently in Sanity
 * with its raw value (including nulls) so we can see exactly what's set and
 * what's missing.
 *
 * Run: npx tsx scripts/inspect-brand.ts
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

const targets: Record<string, string[]> = {
  siteSettings: [
    'businessName', 'tagline', 'logoWordmark', 'logoSubmark',
    'heroHeadline', 'heroCtaPrimary', 'heroCtaSecondary', 'heroScrollLabel',
    'phone', 'email', 'address', 'openingHours', 'socialLinks',
    'aboutEyebrow', 'aboutHeading', 'aboutParagraphs', 'aboutCtaLabel', 'aboutCtaHref',
  ],
  footerSection: [
    'brandDescription', 'hoursHeading', 'exploreHeading', 'visitHeading', 'copyrightSuffix',
  ],
  servicesSection: ['heading', 'intro', 'startingFromLabel'],
  serviceMenuSection: ['eyebrow', 'headingStart', 'headingItalic', 'intro'],
  portfolioSection: ['heading', 'description', 'viewDetailsLabel'],
  testimonialsSection: ['eyebrow'],
  bookingCtaSection: ['eyebrow', 'headingStart', 'headingItalic', 'description', 'ctaLabel', 'ctaHref'],
  navigation: ['reserveLabel', 'reserveHref', 'mobileHomeLabel', 'mobileHomeHref'],
};

async function run() {
  for (const [id, fields] of Object.entries(targets)) {
    const doc = await client.getDocument(id);
    console.log(`\n=== ${id} ${doc ? '' : '(MISSING)'} ===`);
    if (!doc) continue;
    for (const f of fields) {
      const v = (doc as Record<string, unknown>)[f];
      const repr = v === undefined ? '⌀ (undefined)'
        : v === null ? '⌀ (null)'
        : typeof v === 'string' ? JSON.stringify(v)
        : JSON.stringify(v).slice(0, 200);
      console.log(`  ${f}: ${repr}`);
    }
  }

  // List collection brand traces
  const cats = await client.fetch<{ _id: string; title: string; description?: string }[]>(
    `*[_type == "serviceCategory"]{ _id, title, description } | order(order asc)`
  );
  console.log('\n=== serviceCategory[] (titles only) ===');
  for (const c of cats) console.log(`  ${c._id}: ${c.title} — ${c.description ?? '⌀'}`);

  const tests = await client.fetch<{ _id: string; quote: string; author: string }[]>(
    `*[_type == "testimonial"]{ _id, quote, author } | order(order asc)`
  );
  console.log('\n=== testimonial[] (full quotes) ===');
  for (const t of tests) console.log(`  ${t._id}: ${t.author} — ${t.quote}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
