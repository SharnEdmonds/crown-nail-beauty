/**
 * One-shot seed script. Populates all singleton sections and collection docs
 * from the existing hardcoded content so the site looks identical after CMS wiring.
 *
 * Run: npx tsx scripts/seed-sanity.ts
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-31',
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function uploadImage(relativePath: string, filename: string) {
  const buffer = readFileSync(join(process.cwd(), 'public', relativePath));
  const asset = await client.assets.upload('image', buffer, { filename });
  return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: asset._id } };
}

async function run() {
  console.log('Uploading images...');
  const galleryAssets = await Promise.all([
    uploadImage('images/Gallery_img1.webp', 'Gallery_img1.webp'),
    uploadImage('images/Gallery_img2.webp', 'Gallery_img2.webp'),
    uploadImage('images/Gallery_img3.webp', 'Gallery_img3.webp'),
    uploadImage('images/Gallery_img4.webp', 'Gallery_img4.webp'),
    uploadImage('images/Gallery_img5.webp', 'Gallery_img5.webp'),
  ]);
  const logoAsset = await uploadImage('images/Logo.webp', 'Logo.webp');
  const aboutAsset = galleryAssets[1]; // currently uses Gallery_img2

  console.log('Seeding singletons...');

  const siteSettings = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    businessName: 'Crown Nail & Beauty',
    tagline: 'Where meticulous craftsmanship meets serene luxury.',
    logoWordmark: 'CROWN',
    logoSubmark: 'NAIL & BEAUTY',
    logo: logoAsset,
    heroHeadline: 'Where Meticulous Craftsmanship Meets Serene Luxury.',
    heroCtaPrimary: { label: 'RESERVE EXPERIENCE', href: '/' },
    heroCtaSecondary: { label: 'VIEW PORTFOLIO', href: '#gallery' },
    heroScrollLabel: 'Scroll',
    phone: '+64 9 123 4567',
    email: 'hello@crownnails.co.nz',
    address: {
      street: '10/4343 Great North Road',
      suburb: 'Glendene',
      city: 'Auckland',
      postcode: '0602',
    },
    openingHours: [
      { days: 'Mon – Sat', hours: '9:00am – 6:00pm' },
      { days: 'Sunday', hours: '10:00am – 5:30pm' },
    ],
    socialLinks: {
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
    },
    aboutEyebrow: 'Est. 2024 — Glendene, NZ',
    aboutHeading: 'The Crown Philosophy',
    aboutParagraphs: [
      "At Crown, we believe beauty is not just a service — it's an art form. Every brushstroke, every detail, every moment in our studio is crafted with the same precision and passion that defines true artistry.",
      'Our intimate sanctuary is where skilled technicians meet discerning clients. We source only premium products, maintain uncompromising hygiene standards, and take the time to understand your unique vision before we begin.',
      'From bespoke nail artistry to flawless lash extensions, every treatment at Crown is a personalised experience designed to make you feel truly exceptional.',
    ],
    aboutImage: aboutAsset,
    aboutCtaLabel: 'MEET OUR TEAM',
    aboutCtaHref: '#booking',
  };

  const navigation = {
    _id: 'navigation',
    _type: 'navigation',
    links: [
      { label: 'Services', href: '#services' },
      { label: 'Menu', href: '#menu' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'About', href: '#about' },
    ],
    reserveLabel: 'Reserve',
    reserveHref: '#booking',
    mobileHomeLabel: 'Home',
    mobileHomeHref: '#hero',
  };

  const servicesSection = {
    _id: 'servicesSection',
    _type: 'servicesSection',
    heading: 'Our Artistry',
    intro: 'A comprehensive menu of premium treatments designed to enhance your natural beauty.',
    startingFromLabel: 'Starting from',
    cards: [
      {
        _key: 'nail',
        title: 'Nail Artistry',
        description:
          'Experience full structural enhancement with our signature builder gel and dipping powder systems, or express yourself with bespoke hand-painted nail art.',
        href: '#menu',
        categorySlugs: ['gel-polish', 'normal-polish', 'builder-gel', 'dipping-powder'],
      },
      {
        _key: 'lash',
        title: 'Lash Studio',
        description:
          'Transform your gaze with our premium lash extensions, ranging from subtle classic enhancements to full, dramatic volume sets tailored to your eye shape.',
        href: '#menu',
        categorySlugs: ['eyelash-extension'],
      },
      {
        _key: 'waxtint',
        title: 'Wax & Tint',
        description:
          'Refine your features with precision facial waxing and custom-blended tinting for defined brows and lashes that frame your face perfectly.',
        href: '#menu',
        categorySlugs: ['waxing', 'tinting'],
      },
      {
        _key: 'facial',
        title: 'Facial Care',
        description:
          'Rejuvenate your skin with our curated menu of express and deluxe facials, designed to deep cleanse, hydrate, and restore your natural glow.',
        href: '#menu',
        categorySlugs: ['facial-care'],
      },
      {
        _key: 'permanent',
        title: 'Permanent Makeup',
        description:
          'Wake up flawless with our semi-permanent solutions. Expertly applied micro-shading, eyeliner, and lip blush for long-lasting, natural beauty.',
        href: '#menu',
        categorySlugs: ['permanent-makeup'],
      },
    ],
  };

  const serviceMenuSection = {
    _id: 'serviceMenuSection',
    _type: 'serviceMenuSection',
    eyebrow: 'Full Menu',
    headingStart: 'Our',
    headingItalic: 'Services',
    intro: 'Every treatment crafted with precision and care. All prices in NZD.',
    nailSectionHeadingStart: 'Nail',
    nailSectionHeadingItalic: 'Services',
    nailCategorySlugs: ['gel-polish', 'normal-polish', 'builder-gel', 'dipping-powder'],
  };

  const portfolioSection = {
    _id: 'portfolioSection',
    _type: 'portfolioSection',
    heading: 'Selected Works',
    description: 'Drag or use arrows to explore our latest creations.',
    viewDetailsLabel: 'View Details',
    images: [
      { _key: 'g1', image: galleryAssets[0], alt: 'Premium nail artistry detailing' },
      { _key: 'g2', image: galleryAssets[1], alt: 'Elegant manicure finish' },
      { _key: 'g3', image: galleryAssets[2], alt: 'Structural builder gel enhancement' },
      { _key: 'g4', image: galleryAssets[3], alt: 'Bespoke hand-painted design' },
      { _key: 'g5', image: galleryAssets[4], alt: 'Luxury pedicure texture' },
    ],
  };

  const testimonialsSection = {
    _id: 'testimonialsSection',
    _type: 'testimonialsSection',
    eyebrow: 'Testimonials',
  };

  const bookingCtaSection = {
    _id: 'bookingCtaSection',
    _type: 'bookingCtaSection',
    eyebrow: 'Start Your Journey',
    headingStart: 'Ready to Experience',
    headingItalic: 'Excellence?',
    description:
      'Secure your appointment today and let us treat you to the finest nail and beauty care in a serene, luxurious setting.',
    ctaLabel: 'BOOK AN APPOINTMENT',
    ctaHref: '/',
  };

  const footerSection = {
    _id: 'footerSection',
    _type: 'footerSection',
    brandDescription:
      'Where meticulous craftsmanship meets serene luxury. Experience the art of refined beauty in our private sanctuary.',
    hoursHeading: 'Hours',
    exploreHeading: 'Explore',
    exploreLinks: [
      { _key: 'e1', label: 'Services', href: '#services' },
      { _key: 'e2', label: 'Full Menu', href: '#menu' },
      { _key: 'e3', label: 'Portfolio', href: '#gallery' },
      { _key: 'e4', label: 'About Us', href: '#about' },
      { _key: 'e5', label: 'Reservations', href: '#booking' },
    ],
    visitHeading: 'Visit',
    copyrightSuffix: 'NZ. All rights reserved.',
  };

  const serviceCategories = [
    {
      _id: 'category-gel-polish',
      _type: 'serviceCategory',
      title: 'Gel Polish',
      slug: { _type: 'slug', current: 'gel-polish' },
      description: 'Long-lasting colour with mirror-finish shine',
      priceFrom: '$45',
      order: 1,
      services: [
        { _key: 's1', name: 'Gel Polish — Hands', price: '$45' },
        { _key: 's2', name: 'Gel Polish — Feet', price: '$55' },
        { _key: 's3', name: 'Gel Polish Removal', price: '$15' },
      ],
    },
    {
      _id: 'category-normal-polish',
      _type: 'serviceCategory',
      title: 'Classic Polish',
      slug: { _type: 'slug', current: 'normal-polish' },
      description: 'Traditional manicure and pedicure finish',
      priceFrom: '$35',
      order: 2,
      services: [
        { _key: 's1', name: 'Classic Manicure', price: '$35' },
        { _key: 's2', name: 'Classic Pedicure', price: '$45' },
      ],
    },
    {
      _id: 'category-builder-gel',
      _type: 'serviceCategory',
      title: 'Builder Gel',
      slug: { _type: 'slug', current: 'builder-gel' },
      description: 'Structural enhancement for strength and shape',
      priceFrom: '$75',
      order: 3,
      services: [
        { _key: 's1', name: 'Builder Gel Full Set', price: '$85' },
        { _key: 's2', name: 'Builder Gel Overlay', price: '$75' },
        { _key: 's3', name: 'Builder Gel Infill', price: '$65' },
      ],
    },
    {
      _id: 'category-dipping-powder',
      _type: 'serviceCategory',
      title: 'Dipping Powder',
      slug: { _type: 'slug', current: 'dipping-powder' },
      description: 'Durable, lightweight powder-set manicure',
      priceFrom: '$65',
      order: 4,
      services: [
        { _key: 's1', name: 'Dipping Powder Full Set', price: '$75' },
        { _key: 's2', name: 'Dipping Powder Overlay', price: '$65' },
      ],
    },
    {
      _id: 'category-eyelash-extension',
      _type: 'serviceCategory',
      title: 'Eyelash Extensions',
      slug: { _type: 'slug', current: 'eyelash-extension' },
      description: 'Classic, hybrid, and volume sets',
      priceFrom: '$90',
      order: 5,
      services: [
        { _key: 's1', name: 'Classic Set', price: '$90' },
        { _key: 's2', name: 'Hybrid Set', price: '$120' },
        { _key: 's3', name: 'Volume Set', price: '$150' },
        { _key: 's4', name: 'Refill (2-3 weeks)', price: '$70' },
      ],
    },
    {
      _id: 'category-waxing',
      _type: 'serviceCategory',
      title: 'Waxing',
      slug: { _type: 'slug', current: 'waxing' },
      description: 'Precision facial and brow waxing',
      priceFrom: '$15',
      order: 6,
      services: [
        { _key: 's1', name: 'Brow Shape', price: '$20' },
        { _key: 's2', name: 'Lip Wax', price: '$15' },
        { _key: 's3', name: 'Full Face', price: '$55' },
      ],
    },
    {
      _id: 'category-tinting',
      _type: 'serviceCategory',
      title: 'Tinting',
      slug: { _type: 'slug', current: 'tinting' },
      description: 'Custom-blended brow and lash tints',
      priceFrom: '$20',
      order: 7,
      services: [
        { _key: 's1', name: 'Brow Tint', price: '$20' },
        { _key: 's2', name: 'Lash Tint', price: '$25' },
        { _key: 's3', name: 'Brow & Lash Combo', price: '$40' },
      ],
    },
    {
      _id: 'category-facial-care',
      _type: 'serviceCategory',
      title: 'Facial Care',
      slug: { _type: 'slug', current: 'facial-care' },
      description: 'Express and deluxe facials tailored to your skin',
      priceFrom: '$85',
      order: 8,
      services: [
        { _key: 's1', name: 'Express Facial (30 min)', price: '$85' },
        { _key: 's2', name: 'Deluxe Facial (60 min)', price: '$140' },
      ],
    },
    {
      _id: 'category-permanent-makeup',
      _type: 'serviceCategory',
      title: 'Permanent Makeup',
      slug: { _type: 'slug', current: 'permanent-makeup' },
      description: 'Semi-permanent micro-shading, eyeliner, and lip blush',
      priceFrom: '$450',
      order: 9,
      services: [
        { _key: 's1', name: 'Powder Brows', price: '$550' },
        { _key: 's2', name: 'Lip Blush', price: '$600' },
        { _key: 's3', name: 'Eyeliner', price: '$450' },
      ],
    },
  ];

  const testimonials = [
    {
      _id: 'testimonial-1',
      _type: 'testimonial',
      quote:
        'Crown transformed my nails into absolute works of art. The attention to detail and the serene atmosphere made it the most indulgent experience.',
      author: 'Sophie L.',
      service: 'Builder Gel & Nail Art',
      order: 1,
    },
    {
      _id: 'testimonial-2',
      _type: 'testimonial',
      quote:
        "My lash extensions have never looked better. The technicians at Crown truly understand what suits each client's eyes perfectly.",
      author: 'Amelia R.',
      service: 'Volume Lash Set',
      order: 2,
    },
    {
      _id: 'testimonial-3',
      _type: 'testimonial',
      quote:
        'A sanctuary in the heart of Auckland. Every visit feels like an escape, and I leave looking and feeling my absolute best.',
      author: 'Jessica M.',
      service: 'Deluxe Facial',
      order: 3,
    },
  ];

  const all = [
    siteSettings,
    navigation,
    servicesSection,
    serviceMenuSection,
    portfolioSection,
    testimonialsSection,
    bookingCtaSection,
    footerSection,
    ...serviceCategories,
    ...testimonials,
  ];

  const tx = client.transaction();
  for (const doc of all) tx.createOrReplace(doc as never);
  await tx.commit();

  console.log(`Seeded ${all.length} documents.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
