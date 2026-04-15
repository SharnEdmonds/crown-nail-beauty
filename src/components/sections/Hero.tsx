'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import HeroBackdrop from '@/components/ui/HeroBackdrop';
import type { SiteSettings } from '@/lib/types';

interface HeroProps {
    siteSettings: SiteSettings | null;
}

function parseHeadline(headline: string) {
    // Parse headline into styled words: "Craftsmanship" gets italic, line breaks after "Meticulous" and "Craftsmanship"
    const words = headline.split(/\s+/);
    const result: { text: string; italic: boolean }[] = [];
    for (const word of words) {
        // Add line breaks for visual structure (after 2nd and 3rd words for the original layout)
        if (result.length === 2 || result.length === 4) {
            result.push({ text: '\n', italic: false });
        }
        // Make "Craftsmanship" italic (or the 3rd real word)
        const realWords = result.filter(w => w.text !== '\n');
        const isItalic = realWords.length === 2; // 3rd word (0-indexed = 2)
        result.push({ text: word, italic: isItalic });
    }
    return result;
}

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const wordVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
};

import { useUIStore } from '@/lib/store';

export default function Hero({ siteSettings }: HeroProps) {
    const setHandVisible = useUIStore((state) => state.setHandVisible);

    const headline = siteSettings?.heroHeadline ?? '';
    const primary = siteSettings?.heroCtaPrimary;
    const secondary = siteSettings?.heroCtaSecondary;
    const scrollLabel = siteSettings?.heroScrollLabel ?? '';

    const headlineWords = useMemo(() => parseHeadline(headline), [headline]);

    return (
        <section
            id="hero"
            className="relative h-screen w-full flex items-center z-10"
        >
            <motion.div
                onViewportEnter={() => setHandVisible(true)}
                className="absolute inset-0 pointer-events-none"
            />
            <HeroBackdrop />
            {/* Very soft scrim on small screens — just enough lift, hand stays visible */}
            <div
                aria-hidden
                className="absolute inset-0 pointer-events-none lg:hidden"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 55% at 50% 45%, rgba(232,228,224,0.35) 0%, rgba(232,228,224,0.18) 45%, rgba(232,228,224,0) 80%)',
                }}
            />
            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto lg:mx-0 text-center lg:text-left">
                    <motion.h1
                        className="font-serif leading-[0.9] text-crown-black mb-6 md:mb-8 [text-shadow:0_2px_18px_rgba(232,228,224,0.95),0_0_30px_rgba(232,228,224,0.7)] lg:[text-shadow:none]"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {headlineWords.map((word, i) => {
                            if (word.text === '\n') {
                                return <br key={i} />;
                            }
                            return (
                                <motion.span
                                    key={i}
                                    variants={wordVariants}
                                    className={`inline-block mr-[0.3em] ${word.italic ? 'italic pl-4 md:pl-24' : ''}`}
                                >
                                    {word.text}
                                </motion.span>
                            );
                        })}
                    </motion.h1>

                    <motion.div
                        className="flex flex-col md:flex-row gap-4 md:gap-6 mt-8 md:mt-12 pl-2 justify-center lg:justify-start items-center lg:items-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                    >
                        {primary && (
                            <motion.a
                                href={primary.href}
                                whileHover={{ y: -3 }}
                                whileTap={{ y: 0, scale: 0.98 }}
                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className="group relative px-8 py-4 bg-warm-black text-clean-white tracking-widest text-sm rounded-sm inline-flex items-center justify-center shadow-[0_1px_0_rgba(0,0,0,0)] hover:shadow-[0_14px_30px_-12px_rgba(201,169,98,0.45)] transition-shadow duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                            >
                                <span className="absolute inset-0 rounded-sm bg-brushed-gold opacity-0 group-hover:opacity-100 transition-opacity duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <span className="relative flex items-center gap-2 group-hover:text-warm-black transition-colors duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                                    {primary.label}
                                    <span className="inline-block w-0 -ml-2 opacity-0 group-hover:w-4 group-hover:ml-1 group-hover:opacity-100 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">→</span>
                                </span>
                            </motion.a>
                        )}
                        {secondary && (
                            <motion.a
                                href={secondary.href}
                                whileHover={{ y: -3 }}
                                whileTap={{ y: 0, scale: 0.98 }}
                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className="group relative px-8 py-4 border border-warm-black text-warm-black tracking-widest text-sm rounded-sm inline-flex items-center justify-center overflow-hidden hover:text-clean-white hover:border-brushed-gold transition-[color,border-color] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                            >
                                <span className="absolute inset-0 bg-warm-black opacity-0 group-hover:opacity-100 transition-opacity duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <span className="relative flex items-center gap-2">
                                    {secondary.label}
                                    <span className="inline-block w-0 -ml-2 opacity-0 group-hover:w-4 group-hover:ml-1 group-hover:opacity-100 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">→</span>
                                </span>
                            </motion.a>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-4 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <span className="text-[10px] tracking-[0.2em] text-stone-grey uppercase">{scrollLabel}</span>
                <motion.div
                    className="w-[1px] h-8 bg-warm-black origin-top"
                    animate={{ scaleY: [0, 1, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1], times: [0, 0.5, 1] }}
                />
            </motion.div>
        </section>
    );
}
