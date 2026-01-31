export interface SiteSettings {
  businessName: string;
  tagline: string;
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
  aboutHeading: string;
  aboutParagraphs: string[];
  heroHeadline: string;
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

export interface GalleryImage {
  _id: string;
  title: string;
  image: {
    asset: {
      _id: string;
      url: string;
    };
    alt: string;
  };
  order: number;
}
