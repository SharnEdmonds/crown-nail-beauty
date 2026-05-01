/**
 * Second-pass brand patch.
 *
 * The first pass left several gaps:
 *   1. siteSettings.tagline, heroHeadline, hero CTAs, heroScrollLabel,
 *      openingHours, socialLinks, aboutCtaLabel/Href were all null in the
 *      live dataset — meaning the hero had nothing to render. Filling them
 *      in with the demo defaults.
 *   2. testimonial[] documents still mention "Crown" by name. Rewriting just
 *      the brand mention out of each quote — same author, same service,
 *      same sentiment.
 *   3. serviceMenuSection.intro mentioned "NZD" — region-neutralizing.
 *
 * Run: npx tsx scripts/rebrand-patch-2.ts
 */
import { createClient } from '@sanity/client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  throw new Error('Missing Sanity env vars in .env.local');
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-31',
  token,
  useCdn: false,
});

// ─── siteSettings — fill in everything that was null ─────────────

const SITE_SETTINGS_FILL = {
  tagline: 'Where meticulous craftsmanship meets serene luxury.',
  heroHeadline: 'Where Meticulous Craftsmanship Meets Serene Luxury.',
  heroCtaPrimary: { label: 'RESERVE EXPERIENCE', href: '/' },
  heroCtaSecondary: { label: 'VIEW PORTFOLIO', href: '#gallery' },
  heroScrollLabel: 'Scroll',
  openingHours: [
    { _key: 'oh1', days: 'Mon – Sat', hours: '9:00am – 6:00pm' },
    { _key: 'oh2', days: 'Sunday', hours: '10:00am – 5:30pm' },
  ],
  socialLinks: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
  },
  aboutCtaLabel: 'MEET OUR TEAM',
  aboutCtaHref: '#booking',
};

// ─── serviceMenuSection — drop currency mention ───────────────────

const SERVICE_MENU_PATCH = {
  intro: 'Every treatment crafted with precision and care. Sample prices for demo purposes.',
};

// ─── testimonial[] — rewrite each Crown-mentioning quote ─────────
// Strategy: keep the same author + service + sentiment, drop the brand name.
// Map by exact current quote so we don't accidentally rewrite a quote the
// user has already cleaned up.

const TESTIMONIAL_REWRITES: { matchAuthor: string; matchSubstring: string; newQuote: string }[] = [
  {
    matchAuthor: 'Maria K.',
    matchSubstring: 'Crown truly lives up to its name',
    newQuote:
      'From the moment you walk in, you know this place is different. The calm atmosphere, the impeccable results — this studio truly lives up to its reputation.',
  },
  {
    matchAuthor: 'Jessica M.',
    matchSubstring: 'Crown has completely redefined',
    newQuote:
      'This studio has completely redefined what I expect from a nail salon. The attention to detail is unlike anything I have experienced. Every visit feels like a personal pampering session.',
  },
];

// ─── Run ─────────────────────────────────────────────────────────

async function patchSiteSettings() {
  console.log('Patching siteSettings (filling missing fields)...');
  await client.patch('siteSettings').set(SITE_SETTINGS_FILL).commit();
  console.log('  ✓ siteSettings');
}

async function patchServiceMenu() {
  console.log('Patching serviceMenuSection.intro...');
  await client.patch('serviceMenuSection').set(SERVICE_MENU_PATCH).commit();
  console.log('  ✓ serviceMenuSection');
}

async function rewriteTestimonials() {
  console.log('Rewriting testimonial quotes that mention "Crown"...');
  const docs = await client.fetch<{ _id: string; author: string; quote: string }[]>(
    `*[_type == "testimonial"]{ _id, author, quote }`
  );
  for (const rewrite of TESTIMONIAL_REWRITES) {
    const target = docs.find(
      (d) => d.author === rewrite.matchAuthor && d.quote.includes(rewrite.matchSubstring)
    );
    if (!target) {
      console.log(`  • skipped ${rewrite.matchAuthor} — already updated or no match`);
      continue;
    }
    await client.patch(target._id).set({ quote: rewrite.newQuote }).commit();
    console.log(`  ✓ rewrote ${rewrite.matchAuthor} (${target._id})`);
  }

  // Final safety net: any remaining testimonial that still contains "Crown"
  // gets the word swapped to "the studio" so we don't leave a brand mention
  // behind even if the author label drifted.
  const stillCrown = await client.fetch<{ _id: string; author: string; quote: string }[]>(
    `*[_type == "testimonial" && quote match "Crown"]{ _id, author, quote }`
  );
  for (const t of stillCrown) {
    const cleaned = t.quote.replace(/\bCrown\b/g, 'the studio');
    if (cleaned !== t.quote) {
      await client.patch(t._id).set({ quote: cleaned }).commit();
      console.log(`  ✓ swept Crown→studio in ${t.author} (${t._id})`);
    }
  }
}

async function run() {
  await patchSiteSettings();
  await patchServiceMenu();
  await rewriteTestimonials();
  console.log('\nDone.');
}

run().catch((e) => { console.error(e); process.exit(1); });
