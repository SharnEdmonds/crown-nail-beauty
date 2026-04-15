import { type SchemaTypeDefinition } from 'sanity';
import { siteSettings } from './siteSettings';
import { navigation } from './navigation';
import { serviceCategory } from './serviceCategory';
import { testimonial } from './testimonial';
import { servicesSection } from './servicesSection';
import { serviceMenuSection } from './serviceMenuSection';
import { portfolioSection } from './portfolioSection';
import { testimonialsSection } from './testimonialsSection';
import { bookingCtaSection } from './bookingCtaSection';
import { footerSection } from './footerSection';
import { handModel } from './handModel';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    siteSettings,
    navigation,
    serviceCategory,
    testimonial,
    servicesSection,
    serviceMenuSection,
    portfolioSection,
    testimonialsSection,
    bookingCtaSection,
    footerSection,
    handModel,
  ],
};
