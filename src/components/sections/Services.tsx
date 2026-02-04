'use client';

import { motion } from 'framer-motion';
import type { ServiceCategory } from '@/lib/types';

const gridAreas = [
    'md:col-span-2 md:row-span-2',
    'md:col-span-1 md:row-span-1',
    'md:col-span-1 md:row-span-1',
    'md:col-span-1 md:row-span-1',
    'md:col-span-1 md:row-span-1',
];

// Group the 9 Sanity categories into 5 display cards
function groupCategories(categories: ServiceCategory[]) {
    const nailSlugs = ['gel-polish', 'normal-polish', 'builder-gel', 'dipping-powder'];
    const lashSlugs = ['eyelash-extension'];
    const waxTintSlugs = ['waxing', 'tinting'];
    const facialSlugs = ['facial-care'];
    const permanentSlugs = ['permanent-makeup'];

    function lowestPrice(cats: ServiceCategory[]): string {
        const prices = cats.flatMap(c => c.services.map(s => {
            const match = s.price.match(/\d+/);
            return match ? parseInt(match[0]) : Infinity;
        }));
        const min = Math.min(...prices);
        return min === Infinity ? '' : String(min);
    }

    function filterBySlug(slugs: string[]) {
        return categories.filter(c => slugs.includes(c.slug?.current));
    }

    const nail = filterBySlug(nailSlugs);
    const lash = filterBySlug(lashSlugs);
    const waxTint = filterBySlug(waxTintSlugs);
    const facial = filterBySlug(facialSlugs);
    const permanent = filterBySlug(permanentSlugs);

    return [
        {
            title: 'Nail Artistry',
            description: 'Experience full structural enhancement with our signature builder gel and dipping powder systems, or express yourself with bespoke hand-painted nail art.',
            price: lowestPrice(nail)
        },
        {
            title: 'Lash Studio',
            description: 'Transform your gaze with our premium lash extensions, ranging from subtle classic enhancements to full, dramatic volume sets tailored to your eye shape.',
            price: lowestPrice(lash)
        },
        {
            title: 'Wax & Tint',
            description: 'Refine your features with precision facial waxing and custom-blended tinting for defined brows and lashes that frame your face perfectly.',
            price: lowestPrice(waxTint)
        },
        {
            title: 'Facial Care',
            description: 'Rejuvenate your skin with our curated menu of express and deluxe facials, designed to deep cleanse, hydrate, and restore your natural glow.',
            price: lowestPrice(facial)
        },
        {
            title: 'Permanent Makeup',
            description: 'Wake up flawless with our semi-permanent solutions. Expertly applied micro-shading, eyeliner, and lip blush for long-lasting, natural beauty.',
            price: lowestPrice(permanent)
        },
    ];
}

export default function Services({ categories }: { categories: ServiceCategory[] }) {
    const displayCards = categories?.length ? groupCategories(categories) : [];

    return (
        <section id="services" className="py-12 md:py-24 relative z-10 bg-clean-white/95">
            <div className="container mx-auto px-6">
                <div className="mb-16 max-w-xl">
                    <h2 className="font-serif text-4xl md:text-5xl mb-6">Our Artistry</h2>
                    <p className="text-charcoal-grey">
                        A comprehensive menu of premium treatments designed to enhance your natural beauty.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[280px] md:auto-rows-[320px]">
                    {displayCards.map((service, index) => (
                        <motion.a
                            key={service.title}
                            href="#menu"
                            className={`group relative p-6 md:p-8 bg-clean-white border border-stone-grey/20 hover:border-soft-rose transition-all duration-300 overflow-hidden hover:-translate-y-2 ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="font-serif text-2xl md:text-3xl mb-3 text-warm-black font-medium">{service.title}</h3>
                                    <p className="text-charcoal-grey/90 text-sm md:text-base leading-relaxed max-w-[95%]">{service.description}</p>
                                </div>

                                <div className="flex justify-between items-end border-t border-stone-grey/10 pt-4 mt-4">
                                    <span className="text-xs tracking-widest uppercase text-stone-grey">Starting from</span>
                                    <span className="font-serif text-xl md:text-2xl">${service.price}</span>
                                </div>
                            </div>

                            <div className="absolute inset-0 bg-marble-stone opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
