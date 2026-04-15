'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import type { SiteSettings } from '@/lib/types';
import { urlFor } from '@/lib/sanity-image';

interface AboutProps {
    siteSettings: SiteSettings | null;
}

export default function About({ siteSettings }: AboutProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    });

    const imageY = useTransform(scrollYProgress, [0, 1], [80, -80]);

    if (!siteSettings) return null;
    const aboutImageUrl = siteSettings.aboutImage
        ? urlFor(siteSettings.aboutImage).width(1400).quality(85).url()
        : null;

    return (
        <section
            id="about"
            ref={sectionRef}
            className="relative py-32 z-10 bg-marble-stone overflow-hidden"
        >
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Image with parallax */}
                    {aboutImageUrl && (
                        <div className="relative h-[500px] lg:h-[650px] overflow-hidden rounded-sm hidden md:block">
                            <motion.div
                                className="absolute inset-[-80px] inset-x-0"
                                style={{ y: imageY }}
                            >
                                <Image
                                    src={aboutImageUrl}
                                    alt={siteSettings.aboutHeading}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover"
                                />
                            </motion.div>
                            <div className="absolute inset-0 bg-gradient-to-t from-crown-black/20 to-transparent" />
                        </div>
                    )}

                    {/* Text content with mask reveal */}
                    <div className="space-y-8">
                        <motion.span
                            className="text-xs tracking-[0.3em] uppercase text-brushed-gold"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            {siteSettings.aboutEyebrow}
                        </motion.span>

                        <motion.h2
                            className="font-serif text-5xl lg:text-6xl"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {siteSettings.aboutHeading.split(' ').slice(0, -1).join(' ')}
                            <br />
                            <span className="italic">{siteSettings.aboutHeading.split(' ').slice(-1)[0]}</span>
                        </motion.h2>

                        <motion.div
                            className="space-y-6 text-charcoal-grey"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {siteSettings.aboutParagraphs?.map((paragraph, i) => (
                                <p key={i} className={i === 0 ? 'text-lg leading-relaxed' : 'leading-relaxed'}>
                                    {paragraph}
                                </p>
                            ))}
                        </motion.div>

                        <motion.a
                            href={siteSettings.aboutCtaHref}
                            className="inline-block px-8 py-4 bg-warm-black text-clean-white tracking-widest text-sm hover:bg-crown-black transition-colors duration-300 rounded-sm"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            {siteSettings.aboutCtaLabel}
                        </motion.a>
                    </div>
                </div>
            </div>
        </section>
    );
}
