export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  businessName,
  tagline,
  logoWordmark,
  logoSubmark,
  logo,
  heroHeadline,
  heroCtaPrimary,
  heroCtaSecondary,
  heroScrollLabel,
  phone,
  email,
  address,
  openingHours,
  socialLinks,
  aboutEyebrow,
  aboutHeading,
  aboutParagraphs,
  aboutImage,
  aboutCtaLabel,
  aboutCtaHref
}`;

export const NAVIGATION_QUERY = `*[_type == "navigation"][0]{
  links,
  reserveLabel,
  reserveHref,
  mobileHomeLabel,
  mobileHomeHref
}`;

export const SERVICE_CATEGORIES_QUERY = `*[_type == "serviceCategory"] | order(order asc){
  _id,
  title,
  slug,
  description,
  priceFrom,
  order,
  services[]{
    _key,
    name,
    price,
    note
  }
}`;

export const TESTIMONIALS_QUERY = `*[_type == "testimonial"] | order(order asc){
  _id,
  quote,
  author,
  service,
  order
}`;

export const SERVICES_SECTION_QUERY = `*[_type == "servicesSection"][0]{
  heading,
  intro,
  startingFromLabel,
  cards
}`;

export const SERVICE_MENU_SECTION_QUERY = `*[_type == "serviceMenuSection"][0]{
  eyebrow,
  headingStart,
  headingItalic,
  intro,
  nailSectionHeadingStart,
  nailSectionHeadingItalic,
  nailCategorySlugs
}`;

export const PORTFOLIO_SECTION_QUERY = `*[_type == "portfolioSection"][0]{
  heading,
  description,
  viewDetailsLabel,
  images[]{
    image,
    alt
  }
}`;

export const TESTIMONIALS_SECTION_QUERY = `*[_type == "testimonialsSection"][0]{
  eyebrow
}`;

export const BOOKING_CTA_SECTION_QUERY = `*[_type == "bookingCtaSection"][0]{
  eyebrow,
  headingStart,
  headingItalic,
  description,
  ctaLabel,
  ctaHref
}`;

export const HAND_MODEL_QUERY = `*[_type == "handModel"][0]{
  idleRotationSpeed,
  idleWobbleAmount,
  idleWobbleSpeed,
  scale,
  color,
  roughness,
  metalness,
  nailColor,
  nailRoughness,
  nailMetalness,
  nailThumbColor,
  nailIndexColor,
  nailMiddleColor,
  nailRingColor,
  nailPinkyColor,
  desktopStartPosition,
  desktopStartRotation,
  desktopEndPosition,
  desktopEndRotation,
  mobileStartPosition,
  mobileStartRotation,
  mobileEndPosition,
  mobileEndRotation
}`;

export const FOOTER_SECTION_QUERY = `*[_type == "footerSection"][0]{
  brandDescription,
  hoursHeading,
  exploreHeading,
  exploreLinks,
  visitHeading,
  copyrightSuffix
}`;
