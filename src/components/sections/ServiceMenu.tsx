'use client';

import { motion } from 'framer-motion';
import { Clock, Phone } from 'lucide-react';
import type { ServiceCategory } from '@/lib/types';

interface ServiceMenuProps {
    categories: ServiceCategory[];
    openingHours?: { days: string; hours: string }[];
    phone?: string;
}

export default function ServiceMenu({ categories, openingHours, phone }: ServiceMenuProps) {
    if (!categories?.length) return null;

    // Group into nail vs other for visual layout
    const nailSlugs = ['gel-polish', 'normal-polish', 'builder-gel', 'dipping-powder'];
    const nailCategories = categories.filter(c => nailSlugs.includes(c.slug?.current));
    const otherCategories = categories.filter(c => !nailSlugs.includes(c.slug?.current));

    return (
        <section id="menu" className="py-32 relative z-10 bg-clean-white">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.span
                        className="text-xs tracking-[0.3em] uppercase text-brushed-gold mb-4 block"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        Full Menu
                    </motion.span>
                    <motion.h2
                        className="font-serif text-5xl lg:text-6xl mb-4"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Our <span className="italic">Services</span>
                    </motion.h2>
                    <motion.p
                        className="text-charcoal-grey max-w-lg mx-auto"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Every treatment crafted with precision and care. All prices in NZD.
                    </motion.p>
                </div>

                {/* Nail Services Section */}
                {nailCategories.length > 0 && (
                    <motion.div
                        className="mb-20"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3 className="font-serif text-3xl mb-10 text-center">
                            Nail <span className="italic">Services</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {nailCategories.map((category, catIdx) => (
                                <motion.div
                                    key={category._id}
                                    className="bg-marble-stone/40 border border-stone-grey/10 p-8"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: catIdx * 0.1, duration: 0.5 }}
                                >
                                    <h4 className="font-serif text-2xl mb-1">{category.title}</h4>
                                    <p className="text-stone-grey text-xs mb-6">{category.description}</p>
                                    <div className="space-y-3">
                                        {category.services.map((service) => (
                                            <div key={service._key} className="flex justify-between items-baseline gap-4">
                                                <span className="text-sm text-charcoal-grey">{service.name}</span>
                                                <span className="flex-1 border-b border-dotted border-stone-grey/30 min-w-[40px] translate-y-[-4px]" />
                                                <span className="text-sm font-medium text-crown-black whitespace-nowrap">{service.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Other Services */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {otherCategories.map((category, catIdx) => (
                        <motion.div
                            key={category._id}
                            className="bg-marble-stone/40 border border-stone-grey/10 p-8"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: catIdx * 0.1, duration: 0.5 }}
                        >
                            <h4 className="font-serif text-2xl mb-1">{category.title}</h4>
                            <p className="text-stone-grey text-xs mb-6">{category.description}</p>
                            <div className="space-y-3">
                                {category.services.map((service) => (
                                    <div key={service._key} className="flex justify-between items-baseline gap-4">
                                        <span className="text-sm text-charcoal-grey">{service.name}</span>
                                        <span className="flex-1 border-b border-dotted border-stone-grey/30 min-w-[40px] translate-y-[-4px]" />
                                        <span className="text-sm font-medium text-crown-black whitespace-nowrap">{service.price}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Opening Hours & Contact Banner */}
                {(openingHours || phone) && (
                    <motion.div
                        className="mt-20 max-w-3xl mx-auto bg-crown-black text-clean-white p-10 flex flex-col md:flex-row justify-between items-center gap-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {openingHours && (
                            <div className="flex items-start gap-4">
                                <Clock size={20} className="text-brushed-gold mt-0.5 flex-shrink-0" />
                                <div>
                                    <h5 className="text-xs tracking-[0.2em] uppercase text-brushed-gold mb-3">Opening Hours</h5>
                                    {openingHours.map((oh, i) => (
                                        <p key={i} className="text-sm text-stone-grey">
                                            <span className="text-clean-white font-medium">{oh.days}:</span> {oh.hours}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                        {phone && (
                            <div className="flex items-center gap-4">
                                <Phone size={20} className="text-brushed-gold flex-shrink-0" />
                                <div>
                                    <h5 className="text-xs tracking-[0.2em] uppercase text-brushed-gold mb-1">Book Now</h5>
                                    <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="text-lg font-serif hover:text-brushed-gold transition-colors">
                                        {phone}
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
