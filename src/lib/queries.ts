export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  businessName,
  tagline,
  phone,
  email,
  address,
  openingHours,
  socialLinks
}`;

export const SERVICE_CATEGORIES_QUERY = `*[_type == "serviceCategory"] | order(order asc){
  _id,
  title,
  slug,
  description,
  priceFrom,
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
  service
}`;

export const GALLERY_IMAGES_QUERY = `*[_type == "galleryImage"] | order(order asc){
  _id,
  image{
    asset->{
      _id,
      url
    },
    alt
  },
  title
}`;
