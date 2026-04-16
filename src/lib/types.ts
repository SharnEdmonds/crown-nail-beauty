export interface SanityImage {
  asset?: { _ref?: string; _id?: string; url?: string };
  _type?: 'image';
  alt?: string;
}

export interface LinkItem {
  label: string;
  href: string;
}

export interface SiteSettings {
  businessName: string;
  tagline: string;
  logoWordmark: string;
  logoSubmark: string;
  logo?: SanityImage;
  heroHeadline: string;
  heroCtaPrimary: LinkItem;
  heroCtaSecondary: LinkItem;
  heroScrollLabel: string;
  phone: string;
  email: string;
  address: {
    street: string;
    suburb: string;
    city: string;
    postcode: string;
  };
  openingHours: { days: string; hours: string }[];
  socialLinks: {
    instagram?: string;
    facebook?: string;
  };
  aboutEyebrow: string;
  aboutHeading: string;
  aboutParagraphs: string[];
  aboutImage?: SanityImage;
  aboutCtaLabel: string;
  aboutCtaHref: string;
}

export interface Navigation {
  links: LinkItem[];
  reserveLabel: string;
  reserveHref: string;
  mobileHomeLabel: string;
  mobileHomeHref: string;
}

export interface Service {
  _key: string;
  name: string;
  price: string;
  note?: string;
}

export interface ServiceCategory {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  priceFrom: string;
  order: number;
  services: Service[];
}

export interface Testimonial {
  _id: string;
  quote: string;
  author: string;
  service: string;
  order: number;
}

export interface ServicesSection {
  heading: string;
  intro: string;
  startingFromLabel: string;
  cards: {
    title: string;
    description: string;
    href: string;
    categorySlugs: string[];
  }[];
}

export interface ServiceMenuSection {
  eyebrow: string;
  headingStart: string;
  headingItalic: string;
  intro: string;
  nailSectionHeadingStart: string;
  nailSectionHeadingItalic: string;
  nailCategorySlugs: string[];
}

export interface PortfolioSection {
  heading: string;
  description: string;
  viewDetailsLabel: string;
  images: {
    image: SanityImage;
    alt: string;
  }[];
}

export interface TestimonialsSection {
  eyebrow: string;
}

export interface BookingCtaSection {
  eyebrow: string;
  headingStart: string;
  headingItalic: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface HandModelConfig {
  idleRotationSpeed?: number;
  idleWobbleAmount?: number;
  idleWobbleSpeed?: number;
  scale?: number;
  color?: string;
  roughness?: number;
  metalness?: number;
  nailColor?: string;
  nailRoughness?: number;
  nailMetalness?: number;
  nailThumbColor?: string;
  nailIndexColor?: string;
  nailMiddleColor?: string;
  nailRingColor?: string;
  nailPinkyColor?: string;
  desktopStartPosition?: Vec3;
  desktopStartRotation?: Vec3;
  desktopEndPosition?: Vec3;
  desktopEndRotation?: Vec3;
  mobileStartPosition?: Vec3;
  mobileStartRotation?: Vec3;
  mobileEndPosition?: Vec3;
  mobileEndRotation?: Vec3;
}

export interface FooterSection {
  brandDescription: string;
  hoursHeading: string;
  exploreHeading: string;
  exploreLinks: LinkItem[];
  visitHeading: string;
  copyrightSuffix: string;
}
