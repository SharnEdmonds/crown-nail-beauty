import type { SiteSettings, ServiceCategory } from '@/lib/types';

interface JsonLdProps {
    siteSettings: SiteSettings | null;
    serviceCategories: ServiceCategory[];
}

export default function JsonLd({ siteSettings, serviceCategories }: JsonLdProps) {
    const address = siteSettings?.address;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BeautySalon',
        name: siteSettings?.businessName || 'Crown Nail & Beauty',
        description: siteSettings?.tagline
            ? `${siteSettings.tagline}. Premium nail and beauty services in Auckland, New Zealand.`
            : 'Where meticulous craftsmanship meets serene luxury. Premium nail and beauty services in Auckland, New Zealand.',
        url: 'https://crownnails.co.nz',
        telephone: siteSettings?.phone?.replace(/[^+\d]/g, '') || '',
        email: siteSettings?.email || '',
        address: {
            '@type': 'PostalAddress',
            streetAddress: address?.street || '10/4343 Great North Road',
            addressLocality: address ? `${address.suburb}, ${address.city}` : 'Glendene, Auckland',
            postalCode: address?.postcode || '0602',
            addressCountry: 'NZ',
        },
        priceRange: '$$',
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '09:00',
                closes: '18:00',
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Sunday',
                opens: '10:00',
                closes: '17:30',
            },
        ],
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Beauty Services',
            itemListElement: serviceCategories?.map((cat) => ({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: cat.title,
                    description: cat.description,
                },
            })) || [],
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
