'use client';

import { motion } from 'framer-motion';
import type { BookingCtaSection } from '@/lib/types';

interface BookingCTAProps {
    section: BookingCtaSection | null;
}

export default function BookingCTA({ section }: BookingCTAProps) {
    if (!section) return null;
    return (
        <section id="booking" className="py-20 md:py-32 bg-warm-black text-clean-white relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="block text-sm tracking-[0.2em] text-stone-grey mb-6 uppercase">
                        {section.eyebrow}
                    </span>
                    <h2 className="text-3xl md:text-6xl font-serif mb-8 leading-tight text-clean-white">
                        {section.headingStart} <br />
                        <span className="italic text-brushed-gold">{section.headingItalic}</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-marble-stone/80 mb-12 font-light leading-relaxed">
                        {section.description}
                    </p>

                    <motion.a
                        href={section.ctaHref}
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0, scale: 0.99 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="group relative inline-flex items-center gap-3 px-10 py-5 bg-clean-white text-warm-black text-sm tracking-widest rounded-sm overflow-hidden"
                    >
                        <span className="absolute inset-0 bg-brushed-gold opacity-0 group-hover:opacity-100 transition-opacity duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
                        <span className="relative flex items-center gap-3 group-hover:text-clean-white transition-colors duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                            {section.ctaLabel}
                            <span className="inline-block w-0 -ml-2 opacity-0 group-hover:w-4 group-hover:ml-0 group-hover:opacity-100 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">→</span>
                        </span>
                    </motion.a>
                </motion.div>
            </div>

            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gray-500 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-700 rounded-full blur-[120px]" />
            </div>
        </section>
    );
}
