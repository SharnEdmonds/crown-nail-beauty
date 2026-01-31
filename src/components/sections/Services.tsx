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
        { title: 'Nail Artistry', description: 'Gel, acrylic, builder gel, dipping powder and bespoke designs.', price: lowestPrice(nail) },
        { title: 'Lash Studio', description: 'Classic, Hybrid, and Volume extensions.', price: lowestPrice(lash) },
        { title: 'Wax & Tint', description: 'Precision waxing and tinting services.', price: lowestPrice(waxTint) },
        { title: 'Facial Care', description: 'Rejuvenating express and deluxe facials.', price: lowestPrice(facial) },
        { title: 'Permanent Makeup', description: 'Eyebrow shading, hairstroke, eyeliners and lips.', price: lowestPrice(permanent) },
    ];
}

export default function Services({ categories }: { categories: ServiceCategory[] }) {
    const displayCards = categories?.length ? groupCategories(categories) : [];

    return (
        <section id="services" className="py-24 relative z-10 bg-clean-white/95">
            <div className="container mx-auto px-6">
                <div className="mb-16 max-w-xl">
                    <h2 className="font-serif text-5xl mb-6">Our Artistry</h2>
                    <p className="text-charcoal-grey">
                        A comprehensive menu of premium treatments designed to enhance your natural beauty.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[250px]">
                    {displayCards.map((service, index) => (
                        <motion.a
                            key={service.title}
                            href="#menu"
                            className={`group relative p-8 bg-clean-white border border-stone-grey/20 hover:border-soft-rose transition-all duration-300 overflow-hidden hover:-translate-y-2 ${gridAreas[index] || ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="font-serif text-2xl mb-2 group-hover:text-warm-black transition-colors">{service.title}</h3>
                                    <p className="text-stone-grey text-sm max-w-[80%]">{service.description}</p>
                                </div>

                                <div className="flex justify-between items-end border-t border-stone-grey/10 pt-4 mt-4">
                                    <span className="text-xs tracking-widest uppercase text-stone-grey">Starting from</span>
                                    <span className="font-serif text-xl">${service.price}</span>
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
