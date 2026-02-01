'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import type { SiteSettings } from '@/lib/types';

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

    return (
        <section
            id="about"
            ref={sectionRef}
            className="relative py-32 z-10 bg-marble-stone overflow-hidden marble-texture"
        >
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Image with parallax */}
                    <motion.div
                        className="relative h-[500px] lg:h-[650px] overflow-hidden hidden md:block"
                        style={{ y: imageY }}
                    >
                        <Image
                            src="/images/Gallery_img2.webp"
                            alt="Crown Nail & Beauty studio - The Crown Philosophy"
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-crown-black/20 to-transparent" />
                    </motion.div>

                    {/* Text content with mask reveal */}
                    <div className="space-y-8">
                        <motion.span
                            className="text-xs tracking-[0.3em] uppercase text-brushed-gold"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            Est. 2024 &mdash; {siteSettings?.address?.suburb || 'Auckland'}, NZ
                        </motion.span>

                        <motion.h2
                            className="font-serif text-5xl lg:text-6xl"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {siteSettings?.aboutHeading ? (
                                <>
                                    {siteSettings.aboutHeading.split(' ').slice(0, -1).join(' ')}
                                    <br />
                                    <span className="italic">{siteSettings.aboutHeading.split(' ').slice(-1)[0]}</span>
                                </>
                            ) : (
                                <>
                                    The Crown
                                    <br />
                                    <span className="italic">Philosophy</span>
                                </>
                            )}
                        </motion.h2>

                        <motion.div
                            className="space-y-6 text-charcoal-grey"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {siteSettings?.aboutParagraphs?.length ? (
                                siteSettings.aboutParagraphs.map((paragraph, i) => (
                                    <p key={i} className={i === 0 ? 'text-lg leading-relaxed' : 'leading-relaxed'}>
                                        {paragraph}
                                    </p>
                                ))
                            ) : (
                                <>
                                    <p className="text-lg leading-relaxed">
                                        At Crown, we believe beauty is not just a service &mdash; it&apos;s an art form.
                                        Every brushstroke, every detail, every moment in our studio is crafted with
                                        the same precision and passion that defines true artistry.
                                    </p>
                                    <p className="leading-relaxed">
                                        Our intimate sanctuary is where skilled technicians meet
                                        discerning clients. We source only premium products, maintain
                                        uncompromising hygiene standards, and take the time to understand your
                                        unique vision before we begin.
                                    </p>
                                    <p className="leading-relaxed">
                                        From bespoke nail artistry to flawless lash extensions, every treatment at
                                        Crown is a personalised experience designed to make you feel truly
                                        exceptional.
                                    </p>
                                </>
                            )}
                        </motion.div>

                        <motion.a
                            href="#booking"
                            className="inline-block px-8 py-4 bg-warm-black text-clean-white tracking-widest text-sm hover:bg-crown-black transition-colors duration-300 rounded-sm"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            MEET OUR TEAM
                        </motion.a>
                    </div>
                </div>
            </div>
        </section>
    );
}
