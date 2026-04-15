import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import JsonLd from '@/components/ui/JsonLd';
import dynamic from 'next/dynamic';
import ThreeBackgroundWrapper from '@/components/three/ThreeBackgroundWrapper';

const ServiceMenu = dynamic(() => import('@/components/sections/ServiceMenu'));
const PortfolioGallery = dynamic(() => import('@/components/sections/PortfolioGallery'));
const About = dynamic(() => import('@/components/sections/About'));
const Testimonials = dynamic(() => import('@/components/sections/Testimonials'));
const BookingCTA = dynamic(() => import('@/components/sections/BookingCTA'));

import { client } from '@/sanity/lib/client';
import {
  SITE_SETTINGS_QUERY,
  NAVIGATION_QUERY,
  SERVICE_CATEGORIES_QUERY,
  TESTIMONIALS_QUERY,
  SERVICES_SECTION_QUERY,
  SERVICE_MENU_SECTION_QUERY,
  PORTFOLIO_SECTION_QUERY,
  TESTIMONIALS_SECTION_QUERY,
  BOOKING_CTA_SECTION_QUERY,
  FOOTER_SECTION_QUERY,
  HAND_MODEL_QUERY,
} from '@/lib/queries';
import type {
  SiteSettings,
  Navigation,
  ServiceCategory,
  Testimonial,
  ServicesSection,
  ServiceMenuSection,
  PortfolioSection,
  TestimonialsSection,
  BookingCtaSection,
  FooterSection,
  HandModelConfig,
} from '@/lib/types';

export const revalidate = 0;

export default async function Home() {
  const [
    siteSettings,
    navigation,
    serviceCategories,
    testimonials,
    servicesSection,
    serviceMenuSection,
    portfolioSection,
    testimonialsSection,
    bookingCtaSection,
    footerSection,
    handModel,
  ] = await Promise.all([
    client.fetch<SiteSettings>(SITE_SETTINGS_QUERY),
    client.fetch<Navigation>(NAVIGATION_QUERY),
    client.fetch<ServiceCategory[]>(SERVICE_CATEGORIES_QUERY),
    client.fetch<Testimonial[]>(TESTIMONIALS_QUERY),
    client.fetch<ServicesSection>(SERVICES_SECTION_QUERY),
    client.fetch<ServiceMenuSection>(SERVICE_MENU_SECTION_QUERY),
    client.fetch<PortfolioSection>(PORTFOLIO_SECTION_QUERY),
    client.fetch<TestimonialsSection>(TESTIMONIALS_SECTION_QUERY),
    client.fetch<BookingCtaSection>(BOOKING_CTA_SECTION_QUERY),
    client.fetch<FooterSection>(FOOTER_SECTION_QUERY),
    client.fetch<HandModelConfig>(HAND_MODEL_QUERY),
  ]);

  return (
    <>
      <JsonLd siteSettings={siteSettings} serviceCategories={serviceCategories} />
      <NavBar siteSettings={siteSettings} navigation={navigation} />
      <ThreeBackgroundWrapper handModel={handModel} />
      <main id="main-content" className="relative">
        <div id="hand-journey">
          <Hero siteSettings={siteSettings} />
          <Services categories={serviceCategories} section={servicesSection} />
          <PortfolioGallery section={portfolioSection} />
        </div>
        <ServiceMenu
          categories={serviceCategories}
          section={serviceMenuSection}
          openingHours={siteSettings?.openingHours}
          phone={siteSettings?.phone}
        />
        <About siteSettings={siteSettings} />
        <Testimonials testimonials={testimonials} section={testimonialsSection} />
        <BookingCTA section={bookingCtaSection} />
      </main>
      <Footer siteSettings={siteSettings} footer={footerSection} navigation={navigation} />
    </>
  );
}
