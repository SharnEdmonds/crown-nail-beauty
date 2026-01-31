import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services'; // Keep static as likely near fold
import JsonLd from '@/components/ui/JsonLd';
import dynamic from 'next/dynamic';

// ThreeBackground is heavy, so we lazy load it and disable SSR to avoid hydration mismatch and improve TTI
const ThreeBackground = dynamic(() => import('@/components/three/ThreeBackground'), { ssr: false });

const ServiceMenu = dynamic(() => import('@/components/sections/ServiceMenu'));
const PortfolioGallery = dynamic(() => import('@/components/sections/PortfolioGallery'));
const About = dynamic(() => import('@/components/sections/About'));
const Testimonials = dynamic(() => import('@/components/sections/Testimonials'));
const Booking = dynamic(() => import('@/components/sections/Booking'));
import { client } from '@/lib/sanity';
import {
  SITE_SETTINGS_QUERY,
  SERVICE_CATEGORIES_QUERY,
  TESTIMONIALS_QUERY,
} from '@/lib/queries';
import type { SiteSettings, ServiceCategory, Testimonial } from '@/lib/types';

export default async function Home() {
  const [siteSettings, serviceCategories, testimonials] = await Promise.all([
    client.fetch<SiteSettings>(SITE_SETTINGS_QUERY),
    client.fetch<ServiceCategory[]>(SERVICE_CATEGORIES_QUERY),
    client.fetch<Testimonial[]>(TESTIMONIALS_QUERY),
  ]);

  return (
    <>
      <JsonLd siteSettings={siteSettings} serviceCategories={serviceCategories} />
      <NavBar />
      <ThreeBackground />
      <main id="main-content" className="relative">
        <div id="hand-journey">
          <Hero headline={siteSettings?.heroHeadline} />
          <Services categories={serviceCategories} />
          <PortfolioGallery />
        </div>
        <ServiceMenu categories={serviceCategories} openingHours={siteSettings?.openingHours} phone={siteSettings?.phone} />
        <About siteSettings={siteSettings} />
        <Testimonials testimonials={testimonials} />
        <Booking categories={serviceCategories} phone={siteSettings?.phone} />
      </main>
      <Footer siteSettings={siteSettings} />
    </>
  );
}
