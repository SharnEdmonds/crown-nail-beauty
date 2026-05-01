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
        name: siteSettings?.businessName || 'Atelier Lumière',
        description: siteSettings?.tagline
            ? `${siteSettings.tagline}. Demo beauty studio template.`
            : 'Demo beauty studio template — sample content only.',
        url: 'https://demo.example.com',
        telephone: siteSettings?.phone?.replace(/[^+\d]/g, '') || '',
        email: siteSettings?.email || '',
        address: {
            '@type': 'PostalAddress',
            streetAddress: address?.street || '1 Sample Street',
            addressLocality: address ? `${address.suburb}, ${address.city}` : 'Demo City',
            postalCode: address?.postcode || '00000',
            addressCountry: 'XX',
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
