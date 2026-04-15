'use client';

import { motion } from 'framer-motion';
import type { ServiceCategory, ServicesSection } from '@/lib/types';

interface ServicesProps {
    categories: ServiceCategory[];
    section: ServicesSection | null;
}

function lowestPriceForSlugs(categories: ServiceCategory[], slugs: string[]): string {
    const filtered = categories.filter((c) => slugs.includes(c.slug?.current));
    const prices = filtered.flatMap((c) =>
        c.services.map((s) => {
            const match = s.price.match(/\d+/);
            return match ? parseInt(match[0]) : Infinity;
        })
    );
    const min = Math.min(...prices);
    return min === Infinity ? '' : String(min);
}

export default function Services({ categories, section }: ServicesProps) {
    if (!section) return null;

    const displayCards = section.cards.map((card) => ({
        title: card.title,
        description: card.description,
        href: card.href,
        price: lowestPriceForSlugs(categories ?? [], card.categorySlugs ?? []),
    }));

    return (
        <section id="services" className="py-12 md:py-24 relative z-10 bg-clean-white/95">
            <div className="container mx-auto px-6">
                <div className="mb-16 max-w-xl">
                    <h2 className="font-serif text-4xl md:text-5xl mb-6">{section.heading}</h2>
                    <p className="text-charcoal-grey">{section.intro}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[280px] md:auto-rows-[320px]">
                    {displayCards.map((service, index) => (
                        <motion.a
                            key={service.title}
                            href={service.href}
                            className={`group relative p-6 md:p-8 bg-clean-white border border-stone-grey/20 hover:border-soft-rose/60 transition-[transform,border-color] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden hover:-translate-y-1 ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="font-serif text-2xl md:text-3xl mb-3 text-warm-black font-medium relative inline-block">
                                        {service.title}
                                        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brushed-gold/80 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
                                    </h3>
                                    <p className="text-charcoal-grey/90 text-sm md:text-base leading-relaxed max-w-[95%]">{service.description}</p>
                                </div>

                                <div className="flex justify-between items-end border-t border-stone-grey/10 pt-4 mt-4">
                                    <span className="text-xs tracking-widest uppercase text-stone-grey">{section.startingFromLabel}</span>
                                    <span className="font-serif text-xl md:text-2xl transition-colors duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-brushed-gold">${service.price}</span>
                                </div>
                            </div>

                            <div className="absolute inset-0 bg-marble-stone opacity-0 group-hover:opacity-[0.06] transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
